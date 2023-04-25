import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReasonMemberRepEq extends Enum<typeof NotComputableReasonMemberRepEq.Enum> {
  constructor(value: Enum.ToString<typeof NotComputableReasonMemberRepEq.Enum> | NotComputableReasonMemberRepEq.Enum) {
    super(value, NotComputableReasonMemberRepEq.Enum);
  }
}
export namespace NotComputableReasonMemberRepEq {
  export enum Enum {
    AUCUNE_INSTANCE_DIRIGEANTE = "aucune_instance_dirigeante",
  }

  export interface Label {
    [Enum.AUCUNE_INSTANCE_DIRIGEANTE]: "Aucune instance dirigeante";
  }
}
