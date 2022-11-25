import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REGEX_EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/i;

export class Email extends SimpleStringValueObject<Email> {
  constructor(email: string) {
    super(email, REGEX_EMAIL);
  }
}
