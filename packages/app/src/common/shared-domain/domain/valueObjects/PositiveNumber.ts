import { NumberValueObject } from "./NumberValueObject";

interface PositiveNumberOptions {
  integer?: boolean;
  strict?: boolean;
}

const defaultOptions: PositiveNumberOptions = {
  integer: false,
  strict: false,
};
export class PositiveNumber<TShort extends boolean = true> extends NumberValueObject<TShort> {
  constructor(value: number, { strict, integer } = defaultOptions) {
    super(value, input => (integer ? Number.isInteger(input) : true) && (strict ? input > 0 : input >= 0));
  }
}
