import { type num, NumberValueObject } from "./NumberValueObject";

export class TupleNumber<TShort extends boolean = true, T extends num[] = num[]> extends NumberValueObject<TShort> {
  constructor(value: T[number], numbers: T) {
    super(value as number, numbers.includes.bind(numbers));
  }
}
