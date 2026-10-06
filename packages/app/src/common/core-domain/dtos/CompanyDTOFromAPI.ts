import { type COUNTIES, type CountryIsoCode, type REGIONS } from "@common/dict";

export type CompanyDTOFromAPI = {
  address?: string;
  city?: string;
  cityCode?: string;
  countryIsoCode?: CountryIsoCode;
  /** Code département */
  countyCode?: keyof COUNTIES;
  nafCode?: string;
  /* Raison sociale */
  name?: string;
  postalCode?: string;
  regionCode?: keyof REGIONS;
  siren?: string;
};
