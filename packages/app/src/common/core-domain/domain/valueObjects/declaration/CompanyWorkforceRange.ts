import { Enum } from "@common/shared-domain/domain/valueObjects";

export class CompanyWorkforceRange extends Enum<typeof CompanyWorkforceRange.Enum> {
  constructor(value: CompanyWorkforceRange.Enum | Enum.ToString<typeof CompanyWorkforceRange.Enum>) {
    super(value, CompanyWorkforceRange.Enum);
  }

  public getLabel() {
    return CompanyWorkforceRange.Label[this.getValue()];
  }
}

export namespace CompanyWorkforceRange {
  export enum Enum {
    FROM_1000_TO_MORE = "1000:",
    FROM_251_TO_999 = "251:999",
    FROM_50_TO_250 = "50:250",
  }

  export const Label = {
    [Enum.FROM_50_TO_250]: "De 50 à 250 inclus",
    [Enum.FROM_251_TO_999]: "De 251 à 999 inclus",
    [Enum.FROM_1000_TO_MORE]: "De 1000 ou plus",
  } as const;

  export type Label = typeof Label;
}
