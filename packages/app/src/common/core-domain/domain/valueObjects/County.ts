import { COUNTIES } from "@common/dict";
import { EnumString } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";

const COUNTIES_KEYS = Object.keys(COUNTIES);

export class County extends EnumString {
  constructor(value: string) {
    super(value, COUNTIES_KEYS);
  }
}
