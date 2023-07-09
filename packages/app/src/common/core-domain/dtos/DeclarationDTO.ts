import { type COUNTIES, type NAF, type REGIONS } from "@common/dict";

import { type DeclarationDTO } from "../../models/generated";
import { type CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";

export { DeclarationDTO };

export type PublicCompanyDTO = {
  countryIsoCode?: string;
  countyCode?: keyof COUNTIES;
  nafCode: keyof NAF;
  name: string;
  regionCode?: keyof REGIONS;
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
