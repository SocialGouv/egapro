import { roundDecimal } from "./helpers";

//////////////////
// INDICATEUR 4 //
//////////////////

export const calculIndicateurCalculable = (
  presenceAugmentation: boolean,
  nombreSalariees: number | undefined,
  nombreSalarieesPeriodeAugmentation: number | undefined
) => {
  return (
    presenceAugmentation &&
    nombreSalariees !== undefined &&
    nombreSalariees > 0 &&
    nombreSalarieesPeriodeAugmentation !== undefined &&
    nombreSalarieesPeriodeAugmentation > 0
  );
};

export const calculIndicateurEcartAugmentation = (
  indicateurCalculable: boolean,
  nombreSalarieesPeriodeAugmentation: number | undefined,
  nombreSalarieesAugmentees: number | undefined
): number | undefined =>
  indicateurCalculable &&
  nombreSalarieesPeriodeAugmentation !== undefined &&
  nombreSalarieesAugmentees !== undefined &&
  nombreSalarieesPeriodeAugmentation >= nombreSalarieesAugmentees
    ? roundDecimal(
        100 * (nombreSalarieesAugmentees / nombreSalarieesPeriodeAugmentation),
        3
      )
    : undefined;

// NOTE
export const calculNote = (
  indicateurEcartAugmentation: number | undefined
): number | undefined =>
  indicateurEcartAugmentation !== undefined
    ? indicateurEcartAugmentation < 100
      ? 0
      : 15
    : undefined;
