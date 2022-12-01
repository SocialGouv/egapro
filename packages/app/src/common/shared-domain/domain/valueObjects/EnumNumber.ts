import type { num } from "./NumberValueObject";
import { NumberValueObject } from "./NumberValueObject";

export class EnumNumber<TShort extends boolean = true> extends NumberValueObject<TShort> {
  constructor(value: number, numbers: num[]) {
    super(value, numbers.includes.bind(numbers));
  }
}
