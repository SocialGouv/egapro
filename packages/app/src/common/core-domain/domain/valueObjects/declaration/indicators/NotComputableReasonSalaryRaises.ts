import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReasonSalaryRaises extends Enum<typeof NotComputableReasonSalaryRaises.Enum> {
  constructor(
    value: Enum.ToString<typeof NotComputableReasonSalaryRaises.Enum> | NotComputableReasonSalaryRaises.Enum,
  ) {
    super(value, NotComputableReasonSalaryRaises.Enum);
  }

  public getLabel() {
    return NotComputableReasonSalaryRaises.Label[this.getValue()];
  }
}
export namespace NotComputableReasonSalaryRaises {
  export enum Enum {
    /** Absence d'augmentations individuelles */
    ABSAUGI = "absaugi",
    /** Effectif des groupes valides inférieur à 40% de l'effectif total */
    EGVI40PCET = "egvi40pcet",
  }

  export const Label = {
    [Enum.ABSAUGI]:
      "Il n'y a pas eu d'augmentations individuelles (hors promotions) au cours de la période de référence",
    [Enum.EGVI40PCET]:
      "L’effectif total des CSP retenues pour le calcul de l'indicateur (c’est-à-dire comptant au moins 10 femmes et 10 hommes) représentent moins de 40% de l'effectif total pris en compte pour le calcul des indicateurs",
  } as const;

  export type Label = typeof Label;
}
