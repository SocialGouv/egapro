import { and, eq, ne } from "drizzle-orm";
import { parseSiren } from "~/modules/domain";
import { db } from "~/server/db";
import { toCompanyInsertValues } from "~/server/db/companyInsert";
import { companies, userCompanies } from "~/server/db/schema";
import { fetchCompanyBySiren } from "~/server/services/weez";

async function resolveCompanyValues(siren: string) {
	try {
		return toCompanyInsertValues(siren, await fetchCompanyBySiren(siren));
	} catch {
		return toCompanyInsertValues(siren, null);
	}
}

export async function syncUserCompanyLink(
	userId: string,
	siret: string | null | undefined,
): Promise<string[]> {
	const siren = parseSiren(siret);

	// Fail-closed: the next sign-in carrying a valid SIRET recreates the link.
	if (!siren) {
		const revoked = await db
			.delete(userCompanies)
			.where(eq(userCompanies.userId, userId))
			.returning({ siren: userCompanies.siren });
		return revoked.map((row) => row.siren);
	}

	// Weez is an HTTP call: kept out of the transaction to avoid long locks.
	const companyValues = await resolveCompanyValues(siren);

	return db.transaction(async (tx) => {
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

		const revoked = await tx
			.delete(userCompanies)
			.where(
				and(eq(userCompanies.userId, userId), ne(userCompanies.siren, siren)),
			)
			.returning({ siren: userCompanies.siren });
		return revoked.map((row) => row.siren);
	});
}
