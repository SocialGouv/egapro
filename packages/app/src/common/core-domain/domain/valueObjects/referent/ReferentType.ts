import { Enum } from "@common/shared-domain/domain/valueObjects";
import { type UnknownMapping } from "@common/utils/types";

type Values = Enum.ToString<typeof ReferentType.Enum>;
export class ReferentType<TLitteral extends Values = Values> extends Enum<typeof ReferentType.Enum> {
  constructor(value: Values extends TLitteral ? ReferentType.Enum | UnknownMapping | Values : TLitteral) {
    super(value, ReferentType.Enum);
  }
}

export namespace ReferentType {
  export enum Enum {
    EMAIL = "email",
    URL = "url",
  }
}
