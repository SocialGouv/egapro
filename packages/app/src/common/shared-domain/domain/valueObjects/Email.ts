import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REG_EMAIL =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/i;

export class Email extends SimpleStringValueObject<Email> {
    constructor(email: string) {
        super(email, REG_EMAIL);
    }
}
