import { Enum } from "../../../../../../common/shared-domain";

export class RemunerationsMode extends Enum<typeof RemunerationsMode.Enum> {
  constructor(value: RemunerationsMode.Enum) {
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
