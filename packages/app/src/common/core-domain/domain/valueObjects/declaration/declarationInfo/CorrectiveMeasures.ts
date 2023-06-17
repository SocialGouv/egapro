import { Enum } from "@common/shared-domain/domain/valueObjects";

export class CorrectiveMeasures extends Enum<typeof CorrectiveMeasures.Enum> {
  constructor(value: CorrectiveMeasures.Enum | Enum.ToString<typeof CorrectiveMeasures.Enum>) {
    super(value, CorrectiveMeasures.Enum);
  }

  public getLabel() {
    return CorrectiveMeasures.Label[this.getValue()];
  }
}
export namespace CorrectiveMeasures {
  export enum Enum {
    /** Mesures envisagées */
    CONSIDERED = "me",
    /** Mesures mises en œuvre */
    IMPLEMENTED = "mmo",
    /** Mesures non envisagées */
    NOT_CONSIDERED = "mne",
  }

  export const Label = {
    [Enum.CONSIDERED]: "Mesures envisagées",
    [Enum.IMPLEMENTED]: "Mesures mise en œuvre",
    [Enum.NOT_CONSIDERED]: "Mesures non envisagées",
  } as const;

  export type Label = typeof Label;
}
