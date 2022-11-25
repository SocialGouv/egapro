import { Enum } from "@common/shared-domain/domain/valueObjects";

export class CorrectiveMeasures extends Enum<typeof CorrectiveMeasures.Enum> {
  constructor(value: CorrectiveMeasures.Enum | Enum.ToString<typeof CorrectiveMeasures.Enum>) {
    super(value, CorrectiveMeasures.Enum);
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
}
