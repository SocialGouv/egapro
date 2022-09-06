import { NAF } from "@common/dict";
import { EnumString } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";

const NAF_KEYS = Object.keys(NAF);

export class NafCode extends EnumString {
  constructor(value: string) {
    super(value, NAF_KEYS);
  }
}
