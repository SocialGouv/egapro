import { useMemo } from "react";
import useSWRImmutable from "swr/immutable";

import { type FetcherReturnImmutable } from "./fetcher";

export type ConfigTypeApi = {
  DEPARTEMENTS?: Record<string, string> | undefined;
  EFFECTIFS?: Record<string, string> | undefined;
  NAF?: Record<string, string> | undefined;
  PUBLIC_YEARS?: number[] | undefined;
  READONLY?: boolean | undefined;
  REGIONS?: Record<string, string> | undefined;
  REGIONS_TO_DEPARTEMENTS?: Record<string, string[]> | undefined;
  SECTIONS_NAF?: Record<string, string> | undefined;
  YEARS?: number[] | undefined;
};

export type ConfigTypeFormatted = ConfigTypeApi & {
  DEPARTEMENTS_TRIES: Array<[string, string]>;
  LAST_PUBLIC_YEAR: string;
  PUBLIC_YEARS_TRIES: number[];
  REGIONS_TRIES: Array<[string, string]>;
  SECTIONS_NAF_TRIES: Array<[string, string]>;
  departementLabelFromCode: (code: string | undefined) => string;
  nafLabelFromCode: (code: string | undefined) => string;
  regionLabelFromCode: (code: string | undefined) => string;
};

type SelectItemsType = Array<[string, string]>;

/**
 * Return all departments found in config API endpoint, possibly filtered by region.
 *
 * @param config The config return by useConfig
 * @param region The region id
 */
export const filterDepartements = (config: ConfigTypeFormatted, region?: string): SelectItemsType => {
  // TODO: move this function in useConfig return (like regionLabelFromCode).
  if (!config) return [];

  const { DEPARTEMENTS_TRIES, REGIONS_TO_DEPARTEMENTS } = config;

  return !region || !REGIONS_TO_DEPARTEMENTS
    ? DEPARTEMENTS_TRIES
    : DEPARTEMENTS_TRIES.filter(([key, _]) => REGIONS_TO_DEPARTEMENTS[region].includes(key));
};

export const useConfig = (): FetcherReturnImmutable & { config: ConfigTypeFormatted } => {
  const { data, error } = useSWRImmutable<ConfigTypeApi>("/config");

  const isLoading = !data && !error;
  const isError = Boolean(error);

  const { PUBLIC_YEARS, REGIONS, DEPARTEMENTS, NAF, SECTIONS_NAF }: Partial<ConfigTypeApi> = data || {};

  // Dénormalisation des données avec tri.
  const addon = {
    DEPARTEMENTS_TRIES: !DEPARTEMENTS ? [] : Object.entries(DEPARTEMENTS).sort((a, b) => a[1].localeCompare(b[1])),
    REGIONS_TRIES: !REGIONS ? [] : Object.entries(REGIONS).sort((a, b) => a[1].localeCompare(b[1])),
    SECTIONS_NAF_TRIES: !SECTIONS_NAF ? [] : Object.entries(SECTIONS_NAF).sort((a, b) => a[1].localeCompare(b[1])),
    LAST_PUBLIC_YEAR: String(PUBLIC_YEARS?.sort()?.reverse()?.[0] || ""),
    PUBLIC_YEARS_TRIES: PUBLIC_YEARS?.sort()?.reverse() || [],
    regionLabelFromCode: (codeRegion: string | undefined) =>
      codeRegion ? (!REGIONS ? codeRegion : REGIONS[codeRegion]) : "",
    departementLabelFromCode: (codeDepartement: string | undefined) =>
      codeDepartement ? (!DEPARTEMENTS ? codeDepartement : DEPARTEMENTS[codeDepartement]) : "",
    nafLabelFromCode: (codeNaf: string | undefined) =>
      codeNaf ? (!NAF ? codeNaf : codeNaf + " - " + NAF[codeNaf]) : "",
  };

  // We want to ensure that the data is always the same object on every render, once there is a value.
  const newData = useMemo(
    () => ({ ...data, ...addon }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  return {
    config: newData,
    error,
    isLoading,
    isError,
  };
};
