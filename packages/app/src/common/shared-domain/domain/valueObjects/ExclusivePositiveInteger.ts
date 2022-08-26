import { PositiveNumber } from "./PositiveNumber";

export class ExclusivePositiveInteger<TShort extends boolean = true> extends PositiveNumber<TShort> {
  constructor(value: number) {
    super(value, { strict: true, integer: true });
  }
}
