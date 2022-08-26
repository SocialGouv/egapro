import { RangeNumber } from "./RangeNumber";

export class ExclusiveRangeNumber<TShort extends boolean = true> extends RangeNumber<TShort> {
  constructor(value: number, range: RangeNumber.Range) {
    super(value, { strict: true, range });
  }
}
