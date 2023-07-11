import { type Any } from "../../../utils/types";
import { ValidationError } from "../ValidationError";
import { ValueObject } from "../ValueObject";

export abstract class SimpleStringValueObject<Base extends SimpleStringValueObject<Any>> extends ValueObject<string> {
  constructor(
    private value: string,
    private validator: RegExp,
  ) {
    super();
    this.validator = new RegExp(validator.source, validator.flags.replace("g", ""));
    this.validate();
  }

  public getValue() {
    return this.value;
  }

  public equals(v: Base) {
    return v.value === this.value;
  }

  public validate(): asserts this {
    if (!this.validator.test(this.value)) {
      throw new ValidationError(`"${this.value}" is not a valid ${this.constructor.name.toLowerCase()}.`);
    }
  }
}
