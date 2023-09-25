import { Enum } from "@common/shared-domain/domain/valueObjects";

export class AgeRange extends Enum<typeof AgeRange.Enum> {
  constructor(value: AgeRange.Enum | Enum.ToString<typeof AgeRange.Enum>) {
    super(value, AgeRange.Enum);
  }

  public getLabel() {
    return AgeRange.Label[this.getValue()];
  }
}

export namespace AgeRange {
  export enum Enum {
    FROM_30_TO_39 = "30:39",
    FROM_40_TO_49 = "40:49",
    FROM_50_TO_MORE = "50:",
    LESS_THAN_30 = ":29",
  }

  export const Label = {
    [Enum.LESS_THAN_30]: "Moins de 30 ans",
    [Enum.FROM_30_TO_39]: "De 30 à 39 ans",
    [Enum.FROM_40_TO_49]: "De 40 à 49 ans",
    [Enum.FROM_50_TO_MORE]: "50 ans et plus",
  } as const;

  export type Label = typeof Label;
}
