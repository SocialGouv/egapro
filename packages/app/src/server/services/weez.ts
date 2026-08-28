import "server-only";

import { env } from "~/env";
import { getLocationFromPostalCode } from "~/modules/domain";
import { isCompanyDiffusible } from "~/modules/public-api";

const NON_DIFFUSIBLE_NAME = "Entreprise non diffusible";

const WEEZ_TIMEOUT_MS = 10_000;

// Column widths of `companies.country_code` / `country_label`. The registry is
// not bound by them, and neither insert path catches a Postgres overflow: one
// over-long value would break a ProConnect login, or the whole GIP-MDS import.
const COUNTRY_CODE_MAX_LENGTH = 5;
const COUNTRY_LABEL_MAX_LENGTH = 255;
const TWENTY_FOUR_HOURS = 86_400;

// INSEE "tranche d'effectif salarié" code → lower bound of the size band, used
// as a workforce proxy when the registry exposes the band but not an exact
// `effectiftotal` (the usual case for public administrations and many ETI/GE).
// Lower bounds line up with the legal thresholds (50 / 100 / 250). Code "NN"
// (non-employer) and unknown values yield null.
const WORKFORCE_BY_INSEE_TRANCHE: Record<string, number> = {
	"00": 0,
	"01": 1,
	"02": 3,
	"03": 6,
	"11": 10,
	"12": 20,
	"21": 50,
	"22": 100,
	"31": 200,
	"32": 250,
	"41": 500,
	"42": 1000,
	"51": 2000,
	"52": 5000,
	"53": 10000,
};

export function trancheToWorkforce(code: string | null): number | null {
	if (!code) return null;
	return WORKFORCE_BY_INSEE_TRANCHE[code] ?? null;
}

type WeezLegalEntity = {
	siren: string;
	denominationunitelegale: string | null;
	raisonsociale: string | null;
	activiteprincipalenaf25unitelegale: string | null;
	// NAF rév. 2 activity label; describes the same activity as the mapped NAF 2025 nafCode above.
	nomenclatureactiviteprincipalelibelleunitelegale: string | null;
	effectiftotal: number | null;
	// INSEE size-band code; fallback for workforce when `effectiftotal` is null.
	trancheeffectifsunitelegale: string | null;
	numerovoie: string | null;
	typevoie: string | null;
	libellevoie: string | null;
	codepostal: string | null;
	libellecommune: string | null;
	statutdiffusionunitelegale: string | null;
};

// Head office of the legal unit, from `/public/v3/unitelegale/etablissementsiege`
// (schema `EtabDocDtoV3`). INSEE carries the foreign-country fields on the
// establishment only — `findbysiren` has no country key at all — and fills them
// solely when the registered address is abroad.
type WeezEstablishment = {
	codepaysetrangeretablissement: string | null;
	libellepaysetrangeretablissement: string | null;
};

type WeezPaginatedResponse<T> = {
	content: T[];
	pageNumber: number;
	pageSize: number;
	totalElements: number;
	totalPages: number;
};

export type CompanyInfo = {
	name: string;
	address: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	region: string | null;
	departmentCode: string | null;
	departmentLabel: string | null;
	countryCode: string | null;
	countryLabel: string | null;
	workforce: number | null;
	statutDiffusion: string | null;
};

/** France carries no COG code: the label alone marks the state. */
const FRANCE_COUNTRY = { countryCode: null, countryLabel: "FRANCE" } as const;

/** Neither France nor a known foreign country — repaired at the next refresh. */
const UNKNOWN_COUNTRY = { countryCode: null, countryLabel: null } as const;

type CompanyCountry = Pick<CompanyInfo, "countryCode" | "countryLabel">;

function buildAddress(entity: WeezLegalEntity): string | null {
	const streetParts = [
		entity.numerovoie,
		entity.typevoie,
		entity.libellevoie,
	].filter(Boolean);
	const cityParts = [entity.codepostal, entity.libellecommune].filter(Boolean);

	const street = streetParts.join(" ");
	const city = cityParts.join(" ");

	if (street && city) return `${street}, ${city}`;
	if (street) return street;
	if (city) return city;
	return null;
}

function weezUrl(path: string, siren: string): URL {
	const url = new URL(`${env.EGAPRO_WEEZ_API_URL.replace(/\/$/, "")}${path}`);
	url.searchParams.set("siren", siren);
	return url;
}

// The endpoint answers with the single head-office row. Both the bare object and
// the paginated envelope used by the other v3 routes are accepted: reading only
// one of the two shapes would leave the country column silently empty rather
// than fail loudly.
function readEstablishment(payload: unknown): WeezEstablishment | null {
	if (!payload || typeof payload !== "object") return null;
	const content = (payload as WeezPaginatedResponse<WeezEstablishment>).content;
	if (Array.isArray(content)) return content[0] ?? null;
	return payload as WeezEstablishment;
}

async function fetchHeadOffice(
	siren: string,
): Promise<WeezEstablishment | null> {
	const response = await fetch(
		weezUrl("/public/v3/unitelegale/etablissementsiege", siren),
		{
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(WEEZ_TIMEOUT_MS),
			next: { revalidate: TWENTY_FOUR_HOURS },
		},
	);

	if (!response.ok) {
		throw new Error(
			`Weez API error: ${response.status} ${response.statusText}`,
		);
	}

	return readEstablishment(await response.json());
}

/**
 * Resolves the tri-state country of a legal unit.
 *
 * The postal code decides whether the second call is worth making — it never
 * derives the value. A legal unit registered abroad carries neither postal code
 * nor commune, and its country lives on the head office. `fetchCompanyBySiren`
 * runs on every ProConnect login and in a loop over several thousand SIREN on
 * the GIP-MDS import, so the extra request is spent only on that population.
 *
 * A failing or silent head office leaves the country unknown: it is never
 * guessed as France, and it never breaks the main lookup.
 */
async function resolveCountry(
	siren: string,
	postalCode: string | null,
): Promise<CompanyCountry> {
	if (postalCode) return FRANCE_COUNTRY;

	try {
		const establishment = await fetchHeadOffice(siren);
		const countryCode = establishment?.codepaysetrangeretablissement ?? null;
		const countryLabel =
			establishment?.libellepaysetrangeretablissement ?? null;

		// Both halves or neither: a code without a label reads as an unnamed
		// foreign country, and a label without a code is France-shaped. Either
		// would break the tri-state for every consumer downstream.
		if (!countryCode || !countryLabel) return UNKNOWN_COUNTRY;

		// An over-long code is dropped rather than truncated: the code is an
		// identifier, and cutting it would persist a *different* country as
		// authoritative data. The label is a display string, so it degrades the
		// way `nafLabel` already does below.
		if (countryCode.length > COUNTRY_CODE_MAX_LENGTH) return UNKNOWN_COUNTRY;

		return {
			countryCode,
			countryLabel: countryLabel.slice(0, COUNTRY_LABEL_MAX_LENGTH),
		};
	} catch {
		return UNKNOWN_COUNTRY;
	}
}

export async function fetchCompanyBySiren(
	siren: string,
): Promise<CompanyInfo | null> {
	const url = weezUrl("/public/v3/unitelegale/findbysiren", siren);
	url.searchParams.set("page", "0");
	url.searchParams.set("inclure_non_diffusibles", "true");

	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(WEEZ_TIMEOUT_MS),
		next: { revalidate: TWENTY_FOUR_HOURS },
	});

	if (!response.ok) {
		throw new Error(
			`Weez API error: ${response.status} ${response.statusText}`,
		);
	}

	const data =
		(await response.json()) as WeezPaginatedResponse<WeezLegalEntity>;
	const entity = data.content[0];

	if (!entity) return null;

	// Region/department are derived from the establishment postal code, which
	// INSEE exposes as public data even for non-diffusible legal units — so it
	// is resolved before the address is masked below, keeping the columns filled
	// when `address` becomes null.
	const location = getLocationFromPostalCode(entity.codepostal);

	// Coarse geography, kept on non-diffusible units like region and department
	// already are — and for a company registered abroad, those two are empty by
	// construction, so masking the country would leave nothing at all.
	const country = await resolveCountry(siren, entity.codepostal);

	const statutDiffusion = entity.statutdiffusionunitelegale ?? null;

	if (!isCompanyDiffusible(statutDiffusion)) {
		return {
			name:
				entity.denominationunitelegale ||
				entity.raisonsociale ||
				NON_DIFFUSIBLE_NAME,
			address: null,
			nafCode: null,
			nafLabel: null,
			region: location.region,
			departmentCode: location.departmentCode,
			departmentLabel: location.departmentLabel,
			countryCode: country.countryCode,
			countryLabel: country.countryLabel,
			workforce:
				entity.effectiftotal ??
				trancheToWorkforce(entity.trancheeffectifsunitelegale),
			statutDiffusion,
		};
	}

	return {
		name:
			entity.denominationunitelegale ||
			entity.raisonsociale ||
			`Entreprise ${siren}`,
		address: buildAddress(entity),
		nafCode: entity.activiteprincipalenaf25unitelegale ?? null,
		// Clamp to the companies.nafLabel column width (varchar 255) to avoid insert overflow.
		nafLabel:
			entity.nomenclatureactiviteprincipalelibelleunitelegale?.slice(0, 255) ??
			null,
		region: location.region,
		departmentCode: location.departmentCode,
		departmentLabel: location.departmentLabel,
		countryCode: country.countryCode,
		countryLabel: country.countryLabel,
		workforce:
			entity.effectiftotal ??
			trancheToWorkforce(entity.trancheeffectifsunitelegale),
		statutDiffusion,
	};
}
