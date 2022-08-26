import { Enum } from "../../../../../../common/shared-domain";

export class FavorablePopulation extends Enum<typeof FavorablePopulation.Enum> {
  constructor(value: FavorablePopulation.Enum) {
    super(value, FavorablePopulation.Enum);
  }
}
export namespace FavorablePopulation {
  export enum Enum {
    EQUALITY = "egalite",
    MEN = "hommes",
    WOMEN = "femmes",
  }
}
