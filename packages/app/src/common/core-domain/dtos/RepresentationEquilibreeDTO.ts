import { type COUNTIES, type CountryIsoCode, type NAF, type REGIONS } from "@common/dict";
import { type ClearObject } from "@common/utils/types";

import { type CreateRepresentationEquilibreeDTO } from "./CreateRepresentationEquilibreeDTO";

// TODO: refactor company property with CompanyDTO ?

export type RepresentationEquilibreeDTO = ClearObject<
  CreateRepresentationEquilibreeDTO & {
    company: {
      address: string;
      city: string;
      countryCode: CountryIsoCode;
      county?: keyof COUNTIES;
      nafCode: keyof NAF | "[NON-DIFFUSIBLE]";
      name: string;
      postalCode: string;
      region?: keyof REGIONS;
    };
    declaredAt: string;
    modifiedAt: string;
  }
>;
