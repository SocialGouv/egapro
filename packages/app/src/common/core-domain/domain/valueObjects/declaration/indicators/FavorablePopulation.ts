import { Enum } from "@common/shared-domain/domain/valueObjects";

export class FavorablePopulation extends Enum<typeof FavorablePopulation.Enum> {
  constructor(value: Enum.ToString<typeof FavorablePopulation.Enum> | FavorablePopulation.Enum) {
    super(value, FavorablePopulation.Enum);
  }

  public getLabel() {
    return FavorablePopulation.Label[this.getValue()];
  }
}
export namespace FavorablePopulation {
  export enum Enum {
    EQUALITY = "egalite",
    MEN = "hommes",
    WOMEN = "femmes",
  }

  export const Label = {
    [Enum.EQUALITY]: "Égalité",
    [Enum.MEN]: "Hommes",
    [Enum.WOMEN]: "Femmes",
  } as const;

  export type Label = typeof Label;
}
