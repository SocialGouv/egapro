import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import { COUNTY_TO_REGION, DEFAULT_COUNTRY_COG, inseeCodeToCounty } from "@common/dict";

export const getAdditionalMeta = (company: Entreprise) => {
  const countyCode = inseeCodeToCounty(company.firstMatchingEtablissement.codeCommuneEtablissement);
  const regionCode = countyCode ? COUNTY_TO_REGION[countyCode] : null;
  const postalCode = company.firstMatchingEtablissement.codePostalEtablissement;
  const address = company.firstMatchingEtablissement.address.split(postalCode)[0].trim();
  const countryCodeCOG = company.firstMatchingEtablissement.codePaysEtrangerEtablissement ?? DEFAULT_COUNTRY_COG;

  return {
    countyCode,
    regionCode,
    postalCode,
    address,
    countryCodeCOG,
  };
};
