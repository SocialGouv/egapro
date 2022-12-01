import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReason extends Enum<typeof NotComputableReason.Enum> {
  constructor(value: Enum.ToString<typeof NotComputableReason.Enum> | NotComputableReason.Enum) {
    super(value, NotComputableReason.Enum);
  }
}
export namespace NotComputableReason {
  export enum Enum {
    /** Absence d'augmentations individuelles */
    ABSAUGI = "absaugi",
    /** Absence d'augmentations pendant ce congé */
    ABSAUGPDTCM = "absaugpdtcm",
    /** Absence de promotions */
    ABSPROM = "absprom",
    /** Absence de retours de congé maternité */
    ABSRCM = "absrcm",
    /** @deprecated (Valeur vide ?) */
    AM = "am",
    /** Effectif des groupes valides inférieur à 40% de l'effectif total */
    EGVI40PCET = "egvi40pcet",
    /** L'entreprise ne comporte pas au moins 5 femmes et 5 hommes */
    ETSNO5F5H = "etsno5f5h",
  }
}
