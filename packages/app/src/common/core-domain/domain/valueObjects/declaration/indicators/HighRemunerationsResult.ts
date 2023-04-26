import { type RangeNumber } from "@common/shared-domain/domain/valueObjects";
import { RangeInteger } from "@common/shared-domain/domain/valueObjects";

const range: RangeNumber.Range = [0, 5];

export class HighRemunerationsResult extends RangeInteger {
  constructor(value: number) {
    super(value, range);
  }
}
