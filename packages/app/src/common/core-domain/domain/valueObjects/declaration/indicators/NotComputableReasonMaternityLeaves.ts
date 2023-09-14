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
    [Enum.ABSAUGPDTCM]: "Absence d'augmentations salariales pendant la durée du ou des congés maternité",
    [Enum.ABSRCM]: "Absence de retours de congé maternité",
  } as const;

  export type Label = typeof Label;
}
