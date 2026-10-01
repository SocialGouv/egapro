import { ValidationError } from "../ValidationError";
import { SimpleStringValueObject } from "./SimpleStringValueObject";

// Host labels exclude the dot that separates them: `[\w.-]+(?:\.[\w.-]+)+` backtracked exponentially
// (a 54-character input took seconds).
export const REGEX_URL = /^(?:http(s)?:\/\/)?[\w-]+(?:\.[\w-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/i;

// The trailing class still overlaps the host labels, so a failing match stays quadratic in the input length:
// bounded here, it is a few milliseconds at worst.
export const URL_MAX_LENGTH = 2048;

export class Url extends SimpleStringValueObject<Url> {
  constructor(url: string) {
    super(url, REGEX_URL);
  }

  public validate(): asserts this {
    if (this.getValue().length > URL_MAX_LENGTH) {
      throw new ValidationError(`An url must not exceed ${URL_MAX_LENGTH} characters.`);
    }
    super.validate();
  }
}
