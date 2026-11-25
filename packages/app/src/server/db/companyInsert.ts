import {
	companyPlaceholderName,
	isCompanyIdentityUnresolved,
	isUnknownCountry,
} from "~/modules/domain";
import type { companies } from "~/server/db/schema";
import type { CompanyInfo } from "~/server/services/weez";

/**
 * Maps a Weez lookup onto the `companies` insert shape, for the two paths that
 * persist it: the ProConnect login and the GIP-MDS import.
 *
 * Single point on purpose. Both paths used to copy the fields one by one, so a
 * new column stayed silently empty in production unless every copy was updated
 * in the same change.
 */
export function toCompanyInsertValues(
	siren: string,
	info: CompanyInfo | null,
): typeof companies.$inferInsert {
	if (!info) return { siren, name: companyPlaceholderName(siren) };

	return {
		siren,
		name: info.name,
		address: info.address,
		city: info.city ?? null,
		nafCode: info.nafCode,
		nafLabel: info.nafLabel,
		regionCode: info.regionCode ?? null,
		region: info.region,
		departmentCode: info.departmentCode,
		departmentLabel: info.departmentLabel,
		countryCode: info.countryCode,
		countryLabel: info.countryLabel,
		workforce: info.workforce,
		statutDiffusion: info.statutDiffusion,
	};
}

type CompanyInsertValues = typeof companies.$inferInsert;

export function toCompanyRefreshValues(
	values: CompanyInsertValues,
): Partial<CompanyInsertValues> {
	// An unanswered lookup must never overwrite an identity already stored: only
	// a positive registry response refreshes it (same guard as the country below).
	if (isCompanyIdentityUnresolved(values)) return {};
	if (!isUnknownCountry(values)) return values;
	const { countryCode: _code, countryLabel: _label, ...rest } = values;
	return rest;
}
