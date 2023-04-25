import { type COUNTIES, type NAF, type REGIONS, type WORKFORCES } from "@common/dict";

import { type DeclarationDTO } from "../../models/generated";

export { DeclarationDTO };

export type PublicCompanyDTO = {
  countyCode: keyof COUNTIES;
  nafCode: keyof NAF;
  name: string;
  regionCode: keyof REGIONS;
  siren: string;
  ues?: {
    companies: Array<{
      name: string;
      siren: string;
    }>;
    name: string;
  };
  workforce: {
    range: keyof WORKFORCES;
    total: number;
  };
};
