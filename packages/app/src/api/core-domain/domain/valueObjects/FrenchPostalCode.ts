import { SimpleStringValueObject } from "@common/shared-domain/domain/valueObjects";

const REG = /\d{5}/;
export class FrenchPostalCode extends SimpleStringValueObject<FrenchPostalCode> {
  constructor(value: string) {
    super(value, REG);
  }
}
