import { v4 as uuid } from "uuid";

import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REGEX_NAME = /.*/gi;

export class UniqueID extends SimpleStringValueObject<UniqueID> {
  constructor(id?: string) {
    super(id ?? uuid(), REGEX_NAME);
  }
}
