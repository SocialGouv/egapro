import { COUNTRIES_ISO_TO_LIB, type CountryIsoCode } from "@common/dict";
import { TupleString } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";
import { type UnknownMapping } from "@common/utils/types";

const COUNTRY_KEYS = Object.keys(COUNTRIES_ISO_TO_LIB) as CountryIsoCode[];

type Country = (typeof COUNTRY_KEYS)[number] | UnknownMapping;

export class CountryCode extends TupleString<typeof COUNTRY_KEYS> {
  constructor(value: Country) {
    super(value, COUNTRY_KEYS);
  }
}
