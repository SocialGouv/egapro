import { RangeNumber } from "./RangeNumber";

export class RangeInteger<TShort extends boolean = true> extends RangeNumber<TShort> {
  constructor(value: number, range: RangeNumber.Range) {
    super(value, { integer: true, range });
  }
}
