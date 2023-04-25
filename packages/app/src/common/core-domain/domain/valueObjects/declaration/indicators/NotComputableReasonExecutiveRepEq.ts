import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReasonExecutiveRepEq extends Enum<typeof NotComputableReasonExecutiveRepEq.Enum> {
  constructor(
    value: Enum.ToString<typeof NotComputableReasonExecutiveRepEq.Enum> | NotComputableReasonExecutiveRepEq.Enum,
  ) {
    super(value, NotComputableReasonExecutiveRepEq.Enum);
  }
}
export namespace NotComputableReasonExecutiveRepEq {
  export enum Enum {
    AUCUN_CADRE_DIRIGEANT = "aucun_cadre_dirigeant",
    UN_SEUL_CADRE_DIRIGEANT = "un_seul_cadre_dirigeant",
  }

  export interface Label {
    [Enum.AUCUN_CADRE_DIRIGEANT]: "Aucun cadre dirigeant";
    [Enum.UN_SEUL_CADRE_DIRIGEANT]: "Un seul cadre dirigeant";
  }
}
