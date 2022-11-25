import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REGEX_NAME = /.*/gi;

export class Name extends SimpleStringValueObject<Name> {
  constructor(name: string) {
    super(name, REGEX_NAME);
  }
}
