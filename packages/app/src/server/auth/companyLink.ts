import { and, eq, ne, sql } from "drizzle-orm";
import { parseSiren } from "~/modules/domain";
import { type DB, db } from "~/server/db";
import { toCompanyInsertValues } from "~/server/db/companyInsert";
import { companies, userCompanies } from "~/server/db/schema";
import { releaseLocksForUserOnSirens } from "~/server/services/declarationLockService";
import { fetchCompanyBySiren } from "~/server/services/weez";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

async function resolveCompanyValues(siren: string) {
	try {
		return toCompanyInsertValues(siren, await fetchCompanyBySiren(siren));
	} catch {
		return toCompanyInsertValues(siren, null);
	}
}

// Two concurrent sign-ins under different SIRETs would each miss the other's uncommitted link and leave both.
async function lockUserCompanyLinks(tx: Tx, userId: string) {
	await tx.execute(
		sql`SELECT pg_advisory_xact_lock(hashtextextended(${`app_user_company:${userId}`}, 0))`,
	);
}

async function revokeLinks(tx: Tx, userId: string, keptSiren: string | null) {
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
	await releaseLocksForUserOnSirens(tx, userId, revokedSirens);
	return revokedSirens;
}

export async function syncUserCompanyLink(
	userId: string,
	siret: string | null | undefined,
): Promise<string[]> {
	const siren = parseSiren(siret);
	// Weez is an HTTP call: kept out of the transaction to avoid long locks.
	const companyValues = siren ? await resolveCompanyValues(siren) : null;

	return db.transaction(async (tx) => {
		await lockUserCompanyLinks(tx, userId);

		// Fail-closed: the next sign-in carrying a valid SIRET recreates the link.
		if (!siren || !companyValues) return revokeLinks(tx, userId, null);

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

		return revokeLinks(tx, userId, siren);
	});
}
