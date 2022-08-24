import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REG_URL = /^http.*/i;

export class Url extends SimpleStringValueObject<Url> {
  constructor(url: string) {
    super(url, REG_URL);
  }
}
