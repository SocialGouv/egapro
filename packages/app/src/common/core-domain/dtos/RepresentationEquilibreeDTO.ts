import { type COUNTIES, type CountryIsoCode, type NAF, type REGIONS } from "@common/dict";

import { type CreateRepresentationEquilibreeDTO } from "./CreateRepresentationEquilibreeDTO";

export type RepresentationEquilibreeDTO = CreateRepresentationEquilibreeDTO & {
  company: {
    address: string;
    city: string;
    countryCode: CountryIsoCode;
    county?: keyof COUNTIES;
    nafCode: keyof NAF;
    name: string;
    postalCode: string;
    region?: keyof REGIONS;
  };
  declaredAt: string;
  modifiedAt: string;
};
