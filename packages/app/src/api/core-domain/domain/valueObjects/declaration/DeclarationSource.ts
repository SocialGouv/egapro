import { Enum } from "../../../../../common/shared-domain";

export class DeclarationSource extends Enum<typeof DeclarationSource.Enum> {
  constructor(value: DeclarationSource.Enum) {
    super(value, DeclarationSource.Enum);
  }
}
export namespace DeclarationSource {
  export enum Enum {
    API = "api",
    FORMULAIRE = "formulaire",
    SIMULATEUR = "simulateur",
    SOLEN = "solen",
  }
}
