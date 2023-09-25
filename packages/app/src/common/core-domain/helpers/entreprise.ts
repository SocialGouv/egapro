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

/**
 * True if company is closed before 1st of March of the next year.
 *
 * @param company company
 * @param year year of indicators
 */
export const isCompanyClosed = (company: Entreprise, year: number) => {
  const limitForClosedCompanies = new Date(year + 1, 2, 1);
  const closingDate = company.dateCessation;

  // User can't declare if company is closed before 1st of March of the next year.
  return closingDate && new Date(closingDate) < limitForClosedCompanies;
};
