import { and, eq, ne, sql } from "drizzle-orm";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { parseSiren } from "~/modules/domain";
import { logActionInTransaction } from "~/server/audit/log";
import { db } from "~/server/db";
import { toCompanyInsertValues } from "~/server/db/companyInsert";
import { companies, userCompanies } from "~/server/db/schema";
import {
	type DbClient,
	releaseLocksForUserOnSirens,
} from "~/server/services/declarationLockService";
import { fetchCompanyBySiren } from "~/server/services/weez";

export type CompanyLinkAuditContext = {
	userEmail: string;
	ipAddress: string | null;
	userAgent: string | null;
};

type RevocationReason = "siret_changed" | "siret_missing";

async function resolveCompanyValues(siren: string) {
	try {
		return toCompanyInsertValues(siren, await fetchCompanyBySiren(siren));
	} catch {
		return toCompanyInsertValues(siren, null);
	}
}

type Revocation = { revokedSirens: string[]; mirrors: Array<() => void> };

// Two concurrent sign-ins under different SIRETs would each miss the other's uncommitted link and leave both.
async function inUserLinkTransaction(
	userId: string,
	work: (tx: DbClient) => Promise<Revocation>,
): Promise<string[]> {
	const { revokedSirens, mirrors } = await db.transaction(async (tx) => {
		await tx.execute(
			sql`SELECT pg_advisory_xact_lock(hashtextextended(${`app_user_company:${userId}`}, 0))`,
		);
		return work(tx);
	});
	for (const mirror of mirrors) mirror();
	return revokedSirens;
}

async function revokeLinks(
	tx: DbClient,
	userId: string,
	keptSiren: string | null,
	audit: CompanyLinkAuditContext,
): Promise<Revocation> {
	const revoked = await tx
		.delete(userCompanies)
		.where(
			keptSiren
				? and(
						eq(userCompanies.userId, userId),
						ne(userCompanies.siren, keptSiren),
					)
				: eq(userCompanies.userId, userId),
		)
		.returning({ siren: userCompanies.siren });
	const revokedSirens = revoked.map((row) => row.siren);
	const releasedLocks = await releaseLocksForUserOnSirens(
		tx,
		userId,
		revokedSirens,
	);

	const reason: RevocationReason = keptSiren
		? "siret_changed"
		: "siret_missing";
	const actor = {
		status: "success" as const,
		userId,
		userEmail: audit.userEmail,
		ipAddress: audit.ipAddress,
		userAgent: audit.userAgent,
	};
	const mirrors: Array<() => void> = [];
	for (const siren of revokedSirens) {
		mirrors.push(
			await logActionInTransaction(tx, {
				...actor,
				action: AUDIT_ACTIONS.AUTH_COMPANY_LINK_REVOKED,
				siren,
				metadata: { reason },
			}),
		);
	}
	for (const lock of releasedLocks) {
		mirrors.push(
			await logActionInTransaction(tx, {
				...actor,
				action: AUDIT_ACTIONS.DECLARATION_LOCK_RELEASED,
				siren: lock.siren,
				resourceType: "declaration",
				resourceId: lock.declarationId,
				metadata: { reason: "company_link_revoked" },
			}),
		);
	}

	return { revokedSirens, mirrors };
}

export async function isUserLinkedToSiren(
	client: DbClient,
	userId: string,
	siren: string,
): Promise<boolean> {
	const rows = await client
		.select({ siren: userCompanies.siren })
		.from(userCompanies)
		.where(
			and(eq(userCompanies.userId, userId), eq(userCompanies.siren, siren)),
		)
		.limit(1);
	return rows.length > 0;
}

// Throws on a database failure, so the sign-in fails instead of minting a session over stale links.
export async function syncUserCompanyLink(
	userId: string,
	siret: string | null | undefined,
	audit: CompanyLinkAuditContext,
): Promise<string[]> {
	const siren = parseSiren(siret);
	// Fail-closed: the next sign-in carrying a valid SIRET recreates the link.
	if (!siren) {
		return inUserLinkTransaction(userId, (tx) =>
			revokeLinks(tx, userId, null, audit),
		);
	}

	// Weez is an HTTP call: kept out of the transaction to avoid long locks.
	const companyValues = await resolveCompanyValues(siren);
	return inUserLinkTransaction(userId, async (tx) => {
		await tx
			.insert(companies)
			.values(companyValues)
			.onConflictDoUpdate({
				target: companies.siren,
				set: { ...companyValues, updatedAt: new Date() },
			});
		await tx
			.insert(userCompanies)
			.values({ userId, siren })
			.onConflictDoNothing();

		return revokeLinks(tx, userId, siren, audit);
	});
}
