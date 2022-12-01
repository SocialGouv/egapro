import { WORKFORCES } from "@common/dict";
import { EnumString } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";

const WORKFORCE_KEYS = Object.keys(WORKFORCES);

export class CompanyWorkforceRange extends EnumString {
  constructor(value: string) {
    super(value, WORKFORCE_KEYS);
  }
}
