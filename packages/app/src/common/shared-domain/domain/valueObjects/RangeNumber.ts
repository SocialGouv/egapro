import { NumberValueObject } from "./NumberValueObject";

export interface RangeNumberOptions {
  integer?: boolean;
  range: RangeNumber.Range;
  strict?: boolean;
}
export class RangeNumber<TShort extends boolean = true> extends NumberValueObject<TShort> {
  constructor(value: number, { strict, integer, range }: RangeNumberOptions) {
    super(
      value,
      input =>
        (integer ? Number.isInteger(input) : true) &&
        (strict ? input > range[0] && input < range[1] : input >= range[0] && input <= range[1]),
    );
  }
}

export namespace RangeNumber {
  export type Range = [low: number, high: number];
}
