import { escapeStringRegexp } from "@common/utils/string";
import type { UnknownMapping } from "@common/utils/types";

import { SimpleStringValueObject } from "./SimpleStringValueObject";

export class TupleString<T extends readonly string[] = string[]> extends SimpleStringValueObject<TupleString<T>> {
  constructor(value: T[number] | UnknownMapping, strings: T) {
    const escapedValues = strings.map(escapeStringRegexp).join("|");
    super(value, new RegExp(`^(${escapedValues})$`));
  }

  public getValue(): T[number] {
    return super.getValue();
  }
}
