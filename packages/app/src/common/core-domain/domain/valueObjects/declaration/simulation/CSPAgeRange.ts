import { Enum } from "@common/shared-domain/domain/valueObjects";

export class CSPAgeRange extends Enum<typeof CSPAgeRange.Enum> {
  constructor(value: CSPAgeRange.Enum | Enum.ToString<typeof CSPAgeRange.Enum>) {
    super(value, CSPAgeRange.Enum);
  }

  public getLabel() {
    return CSPAgeRange.Label[this.getValue()];
  }
}

export namespace CSPAgeRange {
  export enum Enum {
    FROM_30_TO_39 = "30:39",
    FROM_40_TO_49 = "40:49",
    FROM_50_TO_MORE = "50:",
    LESS_THAN_30 = "0:30",
  }

  export const Label = {
    [Enum.LESS_THAN_30]: "Moins de 30 ans",
    [Enum.FROM_30_TO_39]: "De 30 à 39 ans",
    [Enum.FROM_40_TO_49]: "De 40 à 49 ans",
    [Enum.FROM_50_TO_MORE]: "50 ans et plus",
  } as const;

  export type Label = typeof Label;
}
