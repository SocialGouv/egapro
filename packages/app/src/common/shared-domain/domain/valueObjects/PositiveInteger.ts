import { PositiveNumber } from "./PositiveNumber";

export class PositiveInteger<TShort extends boolean = true> extends PositiveNumber<TShort> {
  constructor(value: number) {
    super(value, { integer: true });
  }
}
