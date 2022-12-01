import { RangeInteger } from "@common/shared-domain/domain/valueObjects/RangeInteger";
import type { RangeNumber } from "@common/shared-domain/domain/valueObjects/RangeNumber";

const range: RangeNumber.Range = [0, 100];
export class DeclarationIndex extends RangeInteger {
  constructor(value: number) {
    super(value, range);
  }
}
