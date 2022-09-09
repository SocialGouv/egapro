import { REGIONS } from "@common/dict";
import { EnumString } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";

const REGION_KEYS = Object.keys(REGIONS);

export class Region extends EnumString {
  constructor(value: string) {
    super(value, REGION_KEYS);
  }
}
