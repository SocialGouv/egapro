import { NumberValueObject } from "./NumberValueObject";

interface SimpleNumberOptions {
  integer?: boolean;
}

const defaultOptions: SimpleNumberOptions = {
  integer: false,
};
export class SimpleNumber<TShort extends boolean = true> extends NumberValueObject<TShort> {
  constructor(value: number, { integer } = defaultOptions) {
    super(value, input => (integer ? Number.isInteger(input) : true));
  }
}
