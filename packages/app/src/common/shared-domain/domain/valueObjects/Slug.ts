import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REGEX_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export class Slug extends SimpleStringValueObject<Slug> {
  constructor(slug: string) {
    super(slug, REGEX_SLUG);
  }
}
