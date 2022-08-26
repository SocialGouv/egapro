import { Enum } from "../../../../../../common/shared-domain";

export class CorrectiveMeasures extends Enum<typeof CorrectiveMeasures.Enum> {
  constructor(value: CorrectiveMeasures.Enum) {
    super(value, CorrectiveMeasures.Enum);
  }
}
export namespace CorrectiveMeasures {
  export enum Enum {
    /** Mesures envisagées */
    ENVISAGED = "me",
    /** Mesures mises en œuvre */
    IMPLEMENTED = "mmo",
    /** Mesures non envisagées */
    NOT_ENVISAGED = "mne",
  }
}
