import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REGEX_URL = /^http.*/i;

export class Url extends SimpleStringValueObject<Url> {
  constructor(url: string) {
    super(url, REGEX_URL);
  }
}
