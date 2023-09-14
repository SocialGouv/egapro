import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReasonPromotionsIndicator extends Enum<typeof NotComputableReasonPromotionsIndicator.Enum> {
  constructor(
    value:
      | Enum.ToString<typeof NotComputableReasonPromotionsIndicator.Enum>
      | NotComputableReasonPromotionsIndicator.Enum,
  ) {
    super(value, NotComputableReasonPromotionsIndicator.Enum);
  }

  public getLabel() {
    return NotComputableReasonPromotionsIndicator.Label[this.getValue()];
  }
}
export namespace NotComputableReasonPromotionsIndicator {
  export enum Enum {
    /** Absence de promotions */
    ABSPROM = "absprom",
    /** Effectif des groupes valides inférieur à 40% de l'effectif total */
    EGVI40PCET = "egvi40pcet",
  }

  export const Label = {
    [Enum.ABSPROM]: "Absence de promotions",
    [Enum.EGVI40PCET]: "Effectif des groupes valides inférieur à 40% de l'effectif total",
  } as const;

  export type Label = typeof Label;
}
