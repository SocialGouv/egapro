import { NumberValueObject } from "./NumberValueObject";

export class PositiveNumber<TShort extends boolean = true> extends NumberValueObject<TShort> {
  constructor(value: number, strict = false) {
    super(value, input => (strict ? input > 0 : input >= 0));
  }
}
