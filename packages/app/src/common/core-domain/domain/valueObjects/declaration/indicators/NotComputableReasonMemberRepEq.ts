import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReasonMemberRepEq extends Enum<typeof NotComputableReasonMemberRepEq.Enum> {
  constructor(value: Enum.ToString<typeof NotComputableReasonMemberRepEq.Enum> | NotComputableReasonMemberRepEq.Enum) {
    super(value, NotComputableReasonMemberRepEq.Enum);
  }

  public getLabel() {
    return NotComputableReasonMemberRepEq.Label[this.getValue()];
  }
}
export namespace NotComputableReasonMemberRepEq {
  export enum Enum {
    AUCUNE_INSTANCE_DIRIGEANTE = "aucune_instance_dirigeante",
  }

  export const Label = {
    [Enum.AUCUNE_INSTANCE_DIRIGEANTE]: "Il n'y a aucune instance dirigeante",
  } as const;

  export type Label = typeof Label;
}
