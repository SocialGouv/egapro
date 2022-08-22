import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REG_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export class Slug extends SimpleStringValueObject<Slug> {
    constructor(slug: string) {
        super(slug, REG_SLUG);
    }
}
