import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REGEX = /.+/;

export class NonEmptyString extends SimpleStringValueObject<NonEmptyString> {
  constructor(value: string) {
    super(value, REGEX);
    this.validate();
  }
}
