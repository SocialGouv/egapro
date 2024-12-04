import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReasonMaternityLeaves extends Enum<typeof NotComputableReasonMaternityLeaves.Enum> {
  constructor(
    value: Enum.ToString<typeof NotComputableReasonMaternityLeaves.Enum> | NotComputableReasonMaternityLeaves.Enum,
  ) {
    super(value, NotComputableReasonMaternityLeaves.Enum);
  }

  public getLabel() {
    return NotComputableReasonMaternityLeaves.Label[this.getValue()];
  }
}

export namespace NotComputableReasonMaternityLeaves {
  export enum Enum {
    /** Absence d'augmentations salariales pendant la durée du ou des congés maternité */
    ABSAUGPDTCM = "absaugpdtcm",
    /** Absence de retours de congé maternité */
    ABSRCM = "absrcm",
  }

  export const Label = {
    [Enum.ABSAUGPDTCM]:
      "Il n’y a pas eu d’augmentations salariales pendant la durée du ou des congés maternité (ou d'adoption)",
    [Enum.ABSRCM]: "Il n'y a pas eu de retours de congé maternité (ou d'adoption) au cours de la période de référence",
  } as const;

  export type Label = typeof Label;
}
