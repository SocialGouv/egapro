import "server-only";

import { env } from "~/env";

const NON_DIFFUSIBLE_NAME = "Entreprise non diffusible";

type WeezLegalEntity = {
  siren: string;
  denominationunitelegale: string | null;
  raisonsociale: string | null;
  activiteprincipaleunitelegale: string | null;
  effectiftotal: number | null;
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
      workforce: entity.effectiftotal ?? null,
    };
  }

  return {
    name:
      entity.denominationunitelegale ||
      entity.raisonsociale ||
      `Entreprise ${siren}`,
    address: buildAddress(entity),
    nafCode: entity.activiteprincipaleunitelegale ?? null,
    workforce: entity.effectiftotal ?? null,
  };
}
