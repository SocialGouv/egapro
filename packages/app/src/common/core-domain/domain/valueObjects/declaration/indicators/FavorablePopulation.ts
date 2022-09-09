import { Enum } from "@common/shared-domain/domain/valueObjects";

export class FavorablePopulation extends Enum<typeof FavorablePopulation.Enum> {
  constructor(value: Enum.ToString<typeof FavorablePopulation.Enum> | FavorablePopulation.Enum) {
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
