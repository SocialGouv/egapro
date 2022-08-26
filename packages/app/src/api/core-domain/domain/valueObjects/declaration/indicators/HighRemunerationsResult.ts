import { RangeInteger } from "../../../../../../common/shared-domain/domain/valueObjects/RangeInteger";
import type { RangeNumber } from "../../../../../../common/shared-domain/domain/valueObjects/RangeNumber";

const range: RangeNumber.Range = [0, 5];

export class HighRemunerationsResult extends RangeInteger {
  constructor(value: number) {
    super(value, range);
  }
}
