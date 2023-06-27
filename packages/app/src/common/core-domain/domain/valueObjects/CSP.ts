import { Enum } from "@common/shared-domain/domain/valueObjects";

export class CSP extends Enum<typeof CSP.Enum> {
  constructor(value: CSP.Enum | Enum.ToString<typeof CSP.Enum>) {
    super(value, CSP.Enum);
  }

  public getLabel() {
    return CSP.Label[this.getValue()];
  }
}

export namespace CSP {
  export enum Enum {
    EMPLOYES = "emp",
    INGENIEURS_CADRES = "ic",
    OUVRIERS = "ouv",
    TECHNICIENS_AGENTS_MAITRISES = "tam",
  }

  export const Label = {
    [Enum.EMPLOYES]: "Employés",
    [Enum.INGENIEURS_CADRES]: "Ingénieurs et cadres",
    [Enum.OUVRIERS]: "Ouvriers",
    [Enum.TECHNICIENS_AGENTS_MAITRISES]: "Techniciens et agents de maîtrise",
  } as const;

  export type Label = typeof Label;
}
