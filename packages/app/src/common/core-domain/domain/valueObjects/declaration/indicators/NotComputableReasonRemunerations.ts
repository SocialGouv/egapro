import { Enum } from "@common/shared-domain/domain/valueObjects";

export class NotComputableReasonRemunerations extends Enum<typeof NotComputableReasonRemunerations.Enum> {
  constructor(
    value: Enum.ToString<typeof NotComputableReasonRemunerations.Enum> | NotComputableReasonRemunerations.Enum,
  ) {
    super(value, NotComputableReasonRemunerations.Enum);
  }

  public getLabel() {
    return NotComputableReasonRemunerations.Label[this.getValue()];
  }
}

export namespace NotComputableReasonRemunerations {
  export enum Enum {
    /** Effectif des groupes valides inférieur à 40% de l'effectif total */
    EGVI40PCET = "egvi40pcet",
  }

  export const Label = {
    [Enum.EGVI40PCET]:
      "Effectif des groupes retenus inférieur à 40% de l'effectif pris en compte pour le calcul des indicateurs",
  } as const;

  export type Label = typeof Label;
}
