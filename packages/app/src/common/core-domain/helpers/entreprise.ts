import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import { COUNTY_TO_REGION, DEFAULT_COUNTY_CODE, inseeCodeToCounty } from "@common/dict";

export const getAdditionalMeta = (company: Entreprise) => {
  const countyCode = inseeCodeToCounty(company.firstMatchingEtablissement.codeCommuneEtablissement);
  const regionCode = countyCode ? COUNTY_TO_REGION[countyCode] : null;
  const postalCode = company.firstMatchingEtablissement.codePostalEtablissement;
  const address = company.firstMatchingEtablissement.address.split(postalCode)[0].trim();
  const countryCode = company.firstMatchingEtablissement.codePaysEtrangerEtablissement ?? DEFAULT_COUNTY_CODE;

  return {
    countyCode,
    regionCode,
    postalCode,
    address,
    countryCode,
  };
};
