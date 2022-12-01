import { PositiveNumber } from "./PositiveNumber";

export class ExclusivePositiveNumber<TShort extends boolean = true> extends PositiveNumber<TShort> {
  constructor(value: number) {
    super(value, { strict: true });
  }
}
