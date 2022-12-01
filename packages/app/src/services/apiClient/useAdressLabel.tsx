import { useConfig } from "./useConfig";

export function useAdressLabel({ departement, region }: { departement?: string; region?: string }) {
  const { config } = useConfig();

  if (!config) return `Région {region} / département {departement}`;

  const { DEPARTEMENTS, REGIONS } = config;

  let result = "";
  if (departement && DEPARTEMENTS) {
    result = DEPARTEMENTS[departement];
  }
  if (region && REGIONS) {
    result += ", " + REGIONS[region];
  }
  return result;
}
