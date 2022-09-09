import { Enum } from "@common/shared-domain/domain/valueObjects";

export class RemunerationsMode extends Enum<typeof RemunerationsMode.Enum> {
  constructor(value: Enum.ToString<typeof RemunerationsMode.Enum> | RemunerationsMode.Enum) {
    super(value, RemunerationsMode.Enum);
  }
}
export namespace RemunerationsMode {
  export enum Enum {
    BRANCH_LEVEL = "niveau_branche",
    CSP = "csp",
    OTHER_LEVEL = "niveau_autre",
  }
}
