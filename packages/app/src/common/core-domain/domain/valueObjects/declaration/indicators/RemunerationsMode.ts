import { Enum } from "@common/shared-domain/domain/valueObjects";

export class RemunerationsMode extends Enum<typeof RemunerationsMode.Enum> {
  constructor(value: Enum.ToString<typeof RemunerationsMode.Enum> | RemunerationsMode.Enum) {
    super(value, RemunerationsMode.Enum);
  }

  public getLabel() {
    return RemunerationsMode.Label[this.getValue()];
  }
}
export namespace RemunerationsMode {
  export enum Enum {
    BRANCH_LEVEL = "niveau_branche",
    CSP = "csp",
    OTHER_LEVEL = "niveau_autre",
  }

  export const Label = {
    [Enum.BRANCH_LEVEL]: "Par niveau ou coefficient hiérarchique en application de la classification de branche",
    [Enum.CSP]: "Par catégorie socio-professionnelle",
    [Enum.OTHER_LEVEL]:
      "Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
  } as const;

  export type Label = typeof Label;
}
