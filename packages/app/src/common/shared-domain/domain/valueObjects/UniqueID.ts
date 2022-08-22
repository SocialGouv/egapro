import uuid from "uuid";
import { SimpleStringValueObject } from "./SimpleStringValueObject";

const REG_NAME = /.*/gi;

export class UniqueID extends SimpleStringValueObject<UniqueID> {
    constructor(id?: string) {
        super(id ?? uuid.v4(), REG_NAME);
    }
}
