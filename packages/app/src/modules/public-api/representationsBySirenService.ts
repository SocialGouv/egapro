import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { releasedRepresentationCampaignJoin } from "~/server/db/publicReleaseConditions";
import {
	campaignDeadlines,
	companies,
	representationDeclarations,
} from "~/server/db/schema";
import type { PublicRepresentationCompanySource } from "./representationProjection";
import {
	publicRepresentationColumns,
	toPublicRepresentation,
} from "./representationProjection";
import type { PublicRepresentationDTO } from "./schemas";

const representationCompanyColumns = {
	siren: companies.siren,
	name: companies.name,
	address: companies.address,
	regionCode: companies.regionCode,
	region: companies.region,
	departmentCode: companies.departmentCode,
	departmentLabel: companies.departmentLabel,
	nafCode: companies.nafCode,
	nafLabel: companies.nafLabel,
	statutDiffusion: companies.statutDiffusion,
};

function submittedRepresentationCondition() {
	return eq(representationDeclarations.status, "submitted");
}

function toCompanySource(row: {
	siren: string;
	name: string;
	address: string | null;
	region: string | null;
	departmentCode: string | null;
	departmentLabel: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	statutDiffusion: string | null;
}): PublicRepresentationCompanySource {
	return {
		siren: row.siren,
		name: row.name,
		address: row.address,
		region: row.region,
		departmentCode: row.departmentCode,
		departmentLabel: row.departmentLabel,
		nafCode: row.nafCode,
		nafLabel: row.nafLabel,
		statutDiffusion: row.statutDiffusion,
	};
}

async function fetchRows(siren: string) {
	return db
		.select({
			...publicRepresentationColumns,
			...representationCompanyColumns,
		})
		.from(representationDeclarations)
		.innerJoin(companies, eq(representationDeclarations.siren, companies.siren))
		.innerJoin(campaignDeadlines, releasedRepresentationCampaignJoin())
		.where(
			and(
				eq(representationDeclarations.siren, siren),
				submittedRepresentationCondition(),
			),
		)
		.orderBy(desc(representationDeclarations.year));
}

export async function getPublicRepresentationsBySiren(
	siren: string,
	limit?: number,
): Promise<PublicRepresentationDTO[]> {
	const rows = await fetchRows(siren);
	const limited = limit !== undefined ? rows.slice(0, limit) : rows;
	return limited.map((row) =>
		toPublicRepresentation(row, toCompanySource(row)),
	);
}
