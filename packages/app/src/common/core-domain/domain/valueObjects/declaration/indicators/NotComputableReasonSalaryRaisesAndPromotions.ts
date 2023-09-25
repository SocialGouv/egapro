import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReasonSalaryRaisesAndPromotions extends Enum<
  typeof NotComputableReasonSalaryRaisesAndPromotions.Enum
> {
  constructor(
    value:
      | Enum.ToString<typeof NotComputableReasonSalaryRaisesAndPromotions.Enum>
      | NotComputableReasonSalaryRaisesAndPromotions.Enum,
  ) {
    super(value, NotComputableReasonSalaryRaisesAndPromotions.Enum);
  }

  public getLabel() {
    return NotComputableReasonSalaryRaisesAndPromotions.Label[this.getValue()];
  }
}
export namespace NotComputableReasonSalaryRaisesAndPromotions {
  export enum Enum {
    /** Absence d'augmentations individuelles */
    ABSAUGI = "absaugi",
    /** L'entreprise ne comporte pas au moins 5 femmes et 5 hommes */
    ETSNO5F5H = "etsno5f5h",
  }

  export const Label = {
    [Enum.ABSAUGI]: "Absence d'augmentations individuelles",
    [Enum.ETSNO5F5H]: "L'entreprise ne comporte pas au moins 5 femmes et 5 hommes",
  } as const;

  export type Label = typeof Label;
}
