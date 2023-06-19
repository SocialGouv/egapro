import { SimpleStringValueObject } from "./SimpleStringValueObject";

export const REGEX_URL = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/i;

export class Url extends SimpleStringValueObject<Url> {
  constructor(url: string) {
    super(url, REGEX_URL);
  }
}
