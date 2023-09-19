import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CompanyDTOFromAPI } from "@common/core-domain/dtos/CompanyDTOFromAPI";
import { type COUNTIES, COUNTRIES_COG_TO_ISO, COUNTY_TO_REGION, inseeCodeToCounty, type NAF } from "@common/dict";
import { AppError, type UseCase } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { type IDeclarationRepo } from "../repo/IDeclarationRepo";

interface Input {
  siren: string;
  year: number;
}

type CompanyApiRechercheEntreprise = {
  activitePrincipale?: string;
  activitePrincipaleUniteLegale?: string;
  allMatchingEtablissements?: Array<{
    activitePrincipaleEtablissement?: string;
    address?: string;
    codeCommuneEtablissement?: string;
    codePostalEtablissement?: string;
    etablissementSiege?: boolean;
    libelleCommuneEtablissement?: string;
    siret?: string;
  }>;
  caractereEmployeurUniteLegale?: string;
  categorieJuridiqueUniteLegale?: string;
  conventions?: [];
  dateCessation?: string;
  dateCreationUniteLegale?: string;
  dateDebut?: string;
  etablissements?: 3;
  etatAdministratifUniteLegale?: string;
  firstMatchingEtablissement?: {
    activitePrincipaleEtablissement?: string;
    address?: string;
    categorieEntreprise?: string;
    codeCommuneEtablissement?: string;
    codePaysEtrangerEtablissement: string;
    codePostalEtablissement?: string;
    etablissementSiege?: true;
    etatAdministratifEtablissement?: string;
    idccs?: [];
    libelleCommuneEtablissement?: string;
    siret?: string;
  };
  highlightLabel?: string;
  label?: string;
  matching?: 3;
  simpleLabel?: string;
  siren?: string;
};

/**
 * Calling Recherche Entreprises for siren.
 *
 *
 */
export class GetCompany implements UseCase<Input, CompanyDTOFromAPI | null> {
  constructor(private readonly declarationRepo: IDeclarationRepo) {}

  public async execute({ siren, year }: Input): Promise<CompanyDTOFromAPI | null> {
    try {
      new Siren(siren);
      new PositiveNumber(year);

      const company: CompanyApiRechercheEntreprise = await fetch(
        `https://api.recherche-entreprises.fabrique.social.gouv.fr/api/v1/entreprise/${siren}`,
        {
          headers: {
            Referer: "egapro",
          },
        },
      ).then(res => res.json());

      const name = company.simpleLabel;
      const limitForClosedCompanies = new Date(year + 1, 2, 1);
      const closingDate = company.dateCessation;

      // User can't declare if company is closed before 1st of March of the next year.
      if (closingDate && new Date(closingDate) < limitForClosedCompanies) {
        throw new GetCompanyClosedError("The Siren matches a closed company");
      }

      const countyCode = company.firstMatchingEtablissement?.codeCommuneEtablissement
        ? (inseeCodeToCounty(company.firstMatchingEtablissement?.codeCommuneEtablissement) as keyof COUNTIES)
        : undefined;

      let address = company.firstMatchingEtablissement?.address;
      const postalCode = company.firstMatchingEtablissement?.codePostalEtablissement;

      if (address && postalCode && address.includes(postalCode)) {
        address = address.split(postalCode)[0].trim();
      }

      const dto: CompanyDTOFromAPI = {
        siren,
        name,
        postalCode,
        address,
        countyCode,
        cityCode: company.firstMatchingEtablissement?.codeCommuneEtablissement,
        city: company.firstMatchingEtablissement?.libelleCommuneEtablissement,
        countryIsoCode: company.firstMatchingEtablissement?.codePaysEtrangerEtablissement
          ? COUNTRIES_COG_TO_ISO[company.firstMatchingEtablissement?.codePaysEtrangerEtablissement]
          : undefined,
        regionCode: countyCode ? COUNTY_TO_REGION[countyCode] : undefined,
        nafCode: company.activitePrincipaleUniteLegale
          ? (company.activitePrincipaleUniteLegale as keyof NAF)
          : undefined,
      };

      return dto;
    } catch (error: unknown) {
      console.error(error);
      throw new GetCompanyError("Cannot get declaration", error as Error);
    }
  }
}

export class GetCompanyClosedError extends AppError {}
export class GetCompanyError extends AppError {}
