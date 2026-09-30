import { SimpleStringValueObject } from "./SimpleStringValueObject";

// Host labels exclude the dot that separates them: `[\w.-]+(?:\.[\w.-]+)+` backtracked exponentially
// (a 54-character input took seconds).
export const REGEX_URL = /^(?:http(s)?:\/\/)?[\w-]+(?:\.[\w-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/i;

export class Url extends SimpleStringValueObject<Url> {
  constructor(url: string) {
    super(url, REGEX_URL);
  }
}
