import { SimpleStringValueObject } from "@common/shared-domain/domain/valueObjects/SimpleStringValueObject";

export class NafCode extends SimpleStringValueObject<NafCode> {
  constructor(value: string) {
    super(value, /^\S+$/);
  }
}
