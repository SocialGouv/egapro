import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReasonExecutiveRepEq extends Enum<typeof NotComputableReasonExecutiveRepEq.Enum> {
  constructor(
    value: Enum.ToString<typeof NotComputableReasonExecutiveRepEq.Enum> | NotComputableReasonExecutiveRepEq.Enum,
  ) {
    super(value, NotComputableReasonExecutiveRepEq.Enum);
  }

  public getLabel() {
    return NotComputableReasonExecutiveRepEq.Label[this.getValue()];
  }
}
export namespace NotComputableReasonExecutiveRepEq {
  export enum Enum {
    AUCUN_CADRE_DIRIGEANT = "aucun_cadre_dirigeant",
    UN_SEUL_CADRE_DIRIGEANT = "un_seul_cadre_dirigeant",
  }

  export const Label = {
    [Enum.AUCUN_CADRE_DIRIGEANT]: "Il y a aucun cadre dirigeant",
    [Enum.UN_SEUL_CADRE_DIRIGEANT]: "Il y a un seul cadre dirigeant",
  } as const;

  export type Label = typeof Label;
}
