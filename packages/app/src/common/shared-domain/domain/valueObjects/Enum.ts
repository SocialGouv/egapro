import type { Any, UnknownMapping } from "@common/utils/types";

import { enumHasValueGuard } from "../../../utils/enum";
import { ValidationError } from "../ValidationError";
import { ValueObject } from "../ValueObject";

export abstract class Enum<TEnum extends object> extends ValueObject<TEnum[keyof TEnum]> {
  constructor(private value: Enum.ToString<TEnum> | TEnum[keyof TEnum] | UnknownMapping, protected enumObject: TEnum) {
    super();
    this.validate();
  }

  public getValue() {
    return this.value as TEnum[keyof TEnum];
  }

  public equals<T extends TEnum>(v: Enum<T>) {
    return (v.value as Any) === this.value;
  }

  public validate(): asserts this {
    if (!enumHasValueGuard(this.enumObject, this.value)) {
      throw new ValidationError(`"${this.value}" is not a valid ${this.constructor.name.toLowerCase()}.`);
    }
  }
}

export namespace Enum {
  export type ToString<TEnum extends object> = TEnum[keyof TEnum] extends string ? `${TEnum[keyof TEnum]}` : never;
}
