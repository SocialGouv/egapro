import { type COUNTIES, type CountryIsoCode, type NAF, type REGIONS } from "@common/dict";

import { type CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";

export type PublicCompanyDTO = {
  countryIsoCode?: CountryIsoCode;
  county?: keyof COUNTIES;
  nafCode: keyof NAF;
  name: string;
  region?: keyof REGIONS;
  siren: string;
  ues?: {
    companies: Array<{
      name: string;
      siren: string;
    }>;
    name: string;
  };
  workforce?: {
    range?: CompanyWorkforceRange.Enum;
    total?: number;
  };
};

export type CompanyDTO = PublicCompanyDTO & {
  address?: string;
  city?: string;
  hasRecoveryPlan?: boolean;
  postalCode?: string;
};
