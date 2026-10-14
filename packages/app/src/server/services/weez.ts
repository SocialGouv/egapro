import "server-only";

import { env } from "~/env";
import {
	getLocationFromPostalCode,
	headOfficeCountry,
	legalUnitCountry,
	type RegistryCountry,
	UNKNOWN_COUNTRY,
} from "~/modules/domain";
import { isCompanyDiffusible } from "~/modules/public-api";

const NON_DIFFUSIBLE_NAME = "Entreprise non diffusible";

const WEEZ_TIMEOUT_MS = 10_000;

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
	// NAF rév. 2 activity code — the nomenclature the label below is written in,
	// and the one we expose. Kept as the source until the NAF 2025 switch (#4089).
	activiteprincipaleunitelegale: string | null;
	// NAF 2025 (rév. 3) activity code. Typed but unmapped: the registry carries
	// no NAF 2025 label, so pairing it with the rév. 2 label below mismatches.
	activiteprincipalenaf25unitelegale: string | null;
	// Nomenclature the rév. 2 code and label belong to (e.g. "NAFRev2").
	nomenclatureactiviteprincipaleunitelegale: string | null;
	// NAF rév. 2 activity label; describes the activity of the rév. 2 code above.
	nomenclatureactiviteprincipalelibelleunitelegale: string | null;
	effectiftotal: number | null;
	// INSEE size-band code; fallback for workforce when `effectiftotal` is null.
	trancheeffectifsunitelegale: string | null;
	numerovoie: string | null;
	typevoie: string | null;
	libellevoie: string | null;
	codepostal: string | null;
	libellecommune: string | null;
	codepaysetrangeretablissement?: string | null;
	libellepaysetrangeretablissement?: string | null;
	statutdiffusionunitelegale: string | null;
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
	city?: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	regionCode?: string | null;
	region: string | null;
	departmentCode: string | null;
	departmentLabel: string | null;
	countryCode: string | null;
	countryLabel: string | null;
	workforce: number | null;
	statutDiffusion: string | null;
};

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

async function fetchHeadOffice(siren: string): Promise<unknown> {
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

	return response.json();
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
	declaredCode: string | null,
	declaredLabel: string | null,
): Promise<RegistryCountry> {
	const fromLegalUnit = legalUnitCountry({
		postalCode,
		declaredCode,
		declaredLabel,
	});
	if (fromLegalUnit) return fromLegalUnit;

	try {
		return headOfficeCountry(await fetchHeadOffice(siren));
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
	url.searchParams.set("inclure_cesse", "true");

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

	const countryCode = entity.codepaysetrangeretablissement ?? null;
	const countryLabel = entity.libellepaysetrangeretablissement ?? null;
	const isForeign = Boolean(countryCode || countryLabel);
	// A foreign postal code can look like a French one. Never derive French
	// geography when Weez identifies the establishment as foreign.
	const location = isForeign
		? {
				regionCode: null,
				region: null,
				departmentCode: null,
				departmentLabel: null,
			}
		: getLocationFromPostalCode(entity.codepostal);

	// Coarse geography, kept on non-diffusible units like region and department
	// already are — and for a company registered abroad, those two are empty by
	// construction, so masking the country would leave nothing at all.
	const country = await resolveCountry(
		siren,
		entity.codepostal,
		countryCode,
		countryLabel,
	);

	const statutDiffusion = entity.statutdiffusionunitelegale ?? null;

	if (!isCompanyDiffusible(statutDiffusion)) {
		return {
			name:
				entity.denominationunitelegale ||
				entity.raisonsociale ||
				NON_DIFFUSIBLE_NAME,
			address: null,
			city: entity.libellecommune ?? null,
			nafCode: null,
			nafLabel: null,
			regionCode: location.regionCode,
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
		city: entity.libellecommune ?? null,
		nafCode: entity.activiteprincipaleunitelegale ?? null,
		// Clamp to the companies.nafLabel column width (varchar 255) to avoid insert overflow.
		nafLabel:
			entity.nomenclatureactiviteprincipalelibelleunitelegale?.slice(0, 255) ??
			null,
		region: location.region,
		regionCode: location.regionCode,
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
