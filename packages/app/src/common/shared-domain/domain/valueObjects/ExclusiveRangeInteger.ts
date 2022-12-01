import { RangeNumber } from "./RangeNumber";

export class ExclusiveRangeInteger<TShort extends boolean = true> extends RangeNumber<TShort> {
  constructor(value: number, range: RangeNumber.Range) {
    super(value, { strict: true, integer: true, range });
  }
}
