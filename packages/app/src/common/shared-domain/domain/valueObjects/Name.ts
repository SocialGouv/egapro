import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REG_NAME = /.*/gi;

export class Name extends SimpleStringValueObject<Name> {
    constructor(name: string) {
        super(name, REG_NAME);
    }
}
