import "server-only";

import { env } from "~/env";

const NON_DIFFUSIBLE_NAME = "Entreprise non diffusible";

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
	workforce: number | null;
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

function isNonDiffusible(entity: WeezLegalEntity): boolean {
	return entity.statutdiffusionunitelegale === "N";
}

export async function fetchCompanyBySiren(
	siren: string,
): Promise<CompanyInfo | null> {
	const baseUrl = env.EGAPRO_WEEZ_API_URL.replace(/\/$/, "");
	const url = new URL(`${baseUrl}/public/v3/unitelegale/findbysiren`);
	url.searchParams.set("siren", siren);
	url.searchParams.set("page", "0");
	url.searchParams.set("inclure_non_diffusibles", "true");

	const TWENTY_FOUR_HOURS = 86_400;

	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(10_000),
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

	if (isNonDiffusible(entity)) {
		return {
			name:
				entity.denominationunitelegale ||
				entity.raisonsociale ||
				NON_DIFFUSIBLE_NAME,
			address: null,
			nafCode: null,
			nafLabel: null,
			workforce:
				entity.effectiftotal ??
				trancheToWorkforce(entity.trancheeffectifsunitelegale),
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
		workforce:
			entity.effectiftotal ??
			trancheToWorkforce(entity.trancheeffectifsunitelegale),
	};
}
