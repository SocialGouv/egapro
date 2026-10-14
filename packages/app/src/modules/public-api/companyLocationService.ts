import "server-only";

import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { companies } from "~/server/db/schema";
import {
	type PublicCompanyLocation,
	toPublicCompanyLocation,
} from "./projection";

export async function getPublicCompanyLocation(
	siren: string,
): Promise<PublicCompanyLocation | null> {
	const [row] = await db
		.select({
			address: companies.address,
			city: companies.city,
			regionCode: companies.regionCode,
			region: companies.region,
			departmentCode: companies.departmentCode,
			departmentLabel: companies.departmentLabel,
			countryCode: companies.countryCode,
			countryLabel: companies.countryLabel,
			statutDiffusion: companies.statutDiffusion,
		})
		.from(companies)
		.where(eq(companies.siren, siren))
		.limit(1);
	return row ? toPublicCompanyLocation(row) : null;
}
