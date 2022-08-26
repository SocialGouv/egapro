import escapeStringRegexp from "escape-string-regexp";
import { SimpleStringValueObject } from "./SimpleStringValueObject";

export class EnumString extends SimpleStringValueObject<EnumString> {
  constructor(value: string, strings: string[]) {
    const escapedValues = strings.map(escapeStringRegexp).join("|");
    super(value, new RegExp(`^(${escapedValues})$`));
  }
}
