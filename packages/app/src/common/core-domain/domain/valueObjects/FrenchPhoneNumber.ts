import { SimpleStringValueObject } from "@common/shared-domain/domain/valueObjects";

const REGEX = /\d{10}/;
export class FrenchPhoneNumber extends SimpleStringValueObject<FrenchPhoneNumber> {
  constructor(value: string) {
    super(value, REGEX);
  }
}
