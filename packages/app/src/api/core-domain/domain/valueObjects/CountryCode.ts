import { COUNTRIES_ISO_TO_LIB } from "@common/dict";
import { EnumString } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";

const COUNTRY_KEYS = Object.keys(COUNTRIES_ISO_TO_LIB);

export class CountryCode extends EnumString {
  constructor(value: string) {
    super(value, COUNTRY_KEYS);
  }
}
