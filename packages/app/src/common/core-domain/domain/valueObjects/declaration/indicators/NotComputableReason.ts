import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReason extends Enum<typeof NotComputableReason.Enum> {
  constructor(value: Enum.ToString<typeof NotComputableReason.Enum> | NotComputableReason.Enum) {
    super(value, NotComputableReason.Enum);
  }

  public getLabel() {
    return NotComputableReason.Label[this.getValue()];
  }
}
export namespace NotComputableReason {
  export enum Enum {
    /** Absence d'augmentations individuelles */
    ABSAUGI = "absaugi",
    /** Absence d'augmentations salariales pendant la durée du ou des congés maternité */
    ABSAUGPDTCM = "absaugpdtcm",
    /** Absence de promotions */
    ABSPROM = "absprom",
    /** Absence de retours de congé maternité */
    ABSRCM = "absrcm",
    /** Effectif des groupes valides inférieur à 40% de l'effectif total */
    EGVI40PCET = "egvi40pcet",
    /** L'entreprise ne comporte pas au moins 5 femmes et 5 hommes */
    ETSNO5F5H = "etsno5f5h",
  }

  export const Label = {
    [Enum.ABSAUGI]: "Absence d'augmentations individuelles",
    [Enum.ABSAUGPDTCM]: "Absence d'augmentations salariales pendant la durée du ou des congés maternité",
    [Enum.ABSPROM]: "Absence de promotions",
    [Enum.ABSRCM]: "Absence de retours de congé maternité",
    [Enum.EGVI40PCET]: "Effectif des groupes valides inférieur à 40% de l'effectif total",
    [Enum.ETSNO5F5H]: "L'entreprise ne comporte pas au moins 5 femmes et 5 hommes",
  } as const;

  export type Label = typeof Label;
}
