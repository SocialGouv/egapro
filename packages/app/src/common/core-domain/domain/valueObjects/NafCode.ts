import { SimpleStringValueObject } from "@common/shared-domain/domain/valueObjects/SimpleStringValueObject";

export class NafCode extends SimpleStringValueObject<NafCode> {
  constructor(value: string) {
    super(value, /^[0-9]{2}\.[0-9]{2}[A-Z](?![\s\S])/);
  }
}
