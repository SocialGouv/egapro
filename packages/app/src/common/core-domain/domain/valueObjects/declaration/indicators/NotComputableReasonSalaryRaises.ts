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
    [Enum.ABSAUGI]: "Absence d'augmentations individuelles",
    [Enum.EGVI40PCET]: "Effectif des groupes valides inférieur à 40% de l'effectif total",
  } as const;

  export type Label = typeof Label;
}
