import { ValidationError } from "../ValidationError";
import { ValueObject } from "../ValueObject";

export type num = bigint | number;

export type NumberValueObjectValidator<TNumType> = (input: TNumType) => boolean;
export abstract class NumberValueObject<
  TShort extends boolean = false,
  TNumType = TShort extends true ? number : num,
> extends ValueObject<TNumType> {
  constructor(
    private value: TNumType,
    private validator: NumberValueObjectValidator<TNumType> = () => true,
  ) {
    super();
    this.validate();
  }

  public getValue() {
    return this.value;
  }

  public equals(v: NumberValueObject<TShort, TNumType>) {
    return v.value === this.value;
  }

  public validate(): asserts this {
    if (!(typeof this.value === "number" || typeof this.value === "bigint") || !this.validator(this.value)) {
      throw new ValidationError(`"${this.value}" is not a valid ${this.constructor.name.toLowerCase()}.`);
    }
  }
}
