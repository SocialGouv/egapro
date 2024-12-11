import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReasonPromotions extends Enum<typeof NotComputableReasonPromotions.Enum> {
  constructor(value: Enum.ToString<typeof NotComputableReasonPromotions.Enum> | NotComputableReasonPromotions.Enum) {
    super(value, NotComputableReasonPromotions.Enum);
  }

  public getLabel() {
    return NotComputableReasonPromotions.Label[this.getValue()];
  }
}
export namespace NotComputableReasonPromotions {
  export enum Enum {
    /** Absence de promotions */
    ABSPROM = "absprom",
    /** Effectif des groupes valides inférieur à 40% de l'effectif total */
    EGVI40PCET = "egvi40pcet",
  }

  export const Label = {
    [Enum.ABSPROM]: "Absence de promotions au cours de la période de référence",
    [Enum.EGVI40PCET]:
      "Effectif des CSP retenues inférieur à 40% de l'effectif pris en compte pour le calcul des indicateurs",
  } as const;

  export type Label = typeof Label;
}
