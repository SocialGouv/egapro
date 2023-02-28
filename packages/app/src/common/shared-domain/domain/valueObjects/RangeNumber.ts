import { NumberValueObject } from "./NumberValueObject";

export interface RangeNumberOptions {
  integer?: boolean;
  range: RangeNumber.Range;
  strict?: boolean;
}
export class RangeNumber<TShort extends boolean = true> extends NumberValueObject<TShort> {
  constructor(value: number, private options: RangeNumberOptions) {
    const { strict, integer, range } = options;
    super(
      value,
      input =>
        (integer ? Number.isInteger(input) : true) &&
        (strict ? input > range[0] && input < range[1] : input >= range[0] && input <= range[1]),
    );
  }

  /**
   * If strict, it never can be at min value (infinite numbers) (O.1 is not min in [0, 1], the same as 0.01 and so on)
   */
  public isMin() {
    return this.options.strict ? false : this.getValue() === this.options.range[0];
  }

  /**
   * If strict, it never can be at max value (infinite numbers) (O.9 is not max in [0, 1], the same as 0.99 and so on)
   */
  public isMax() {
    return this.options.strict ? false : this.getValue() === this.options.range[1];
  }
}

export namespace RangeNumber {
  export type Range = [low: number, high: number];
}
