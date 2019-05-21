import { AppState } from "../globals.d";

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

export const calculIndicateurEcartNombreSalarieesAugmentees = (
  indicateurCalculable: boolean,
  nombreSalarieesPeriodeAugmentation: number | undefined,
  nombreSalarieesAugmentees: number | undefined
): number | undefined =>
  indicateurCalculable &&
  nombreSalarieesPeriodeAugmentation !== undefined &&
  nombreSalarieesAugmentees !== undefined &&
  nombreSalarieesPeriodeAugmentation >= nombreSalarieesAugmentees
    ? Math.abs(
        roundDecimal(
          100 *
            (nombreSalarieesAugmentees / nombreSalarieesPeriodeAugmentation),
          3
        )
      )
    : undefined;

// NOTE
export const calculNote = (
  indicateurEcartNombreSalarieesAugmentees: number | undefined
): number | undefined =>
  indicateurEcartNombreSalarieesAugmentees !== undefined
    ? indicateurEcartNombreSalarieesAugmentees < 100
      ? 0
      : 15
    : undefined;

/////////
// ALL //
/////////

export default function calculIndicateurQuatre(state: AppState) {
  const indicateurCalculable = calculIndicateurCalculable(
    state.indicateurQuatre.presenceAugmentation,
    state.indicateurQuatre.nombreSalariees,
    state.indicateurQuatre.nombreSalarieesPeriodeAugmentation
  );

  const indicateurEcartNombreSalarieesAugmentees = calculIndicateurEcartNombreSalarieesAugmentees(
    indicateurCalculable,
    state.indicateurQuatre.nombreSalarieesPeriodeAugmentation,
    state.indicateurQuatre.nombreSalarieesAugmentees
  );

  const noteIndicateurQuatre = calculNote(
    indicateurEcartNombreSalarieesAugmentees
  );

  return {
    indicateurCalculable,
    indicateurEcartNombreSalarieesAugmentees,
    noteIndicateurQuatre
  };
}
