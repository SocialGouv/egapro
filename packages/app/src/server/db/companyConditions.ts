import { sql } from "drizzle-orm";

import { NON_DIFFUSIBLE_LABEL } from "~/modules/public-api/constants";
import { companies } from "~/server/db/schema";

export function diffusibleCompanyCondition() {
	return sql<boolean>`CASE
		WHEN ${companies.statutDiffusion} IS NOT NULL
			THEN ${companies.statutDiffusion} <> 'N'
		ELSE ${companies.address} IS NOT NULL
	END`;
}

/**
 * Sort on the value exposed by the public API, never on a masked legal name.
 * SIREN is used by callers as the deterministic tie-breaker between companies
 * that all expose the same non-diffusible label.
 */
export function publicCompanyNameSortKey() {
	return sql<string>`CASE
		WHEN ${diffusibleCompanyCondition()} THEN lower(${companies.name})
		ELSE lower(${NON_DIFFUSIBLE_LABEL})
	END`;
}
