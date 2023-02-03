import { AppState } from "../globals"
import { roundDecimal } from "./number"

//////////////////
// INDICATEUR 4 //
//////////////////

export const calculIndicateurCalculable = (
  presenceCongeMat: boolean,
  nombreSalarieesPeriodeAugmentation: number | undefined,
) => {
  return presenceCongeMat && nombreSalarieesPeriodeAugmentation !== undefined && nombreSalarieesPeriodeAugmentation > 0
}

export const calculIndicateurEcartNombreSalarieesAugmentees = (
  indicateurCalculable: boolean,
  nombreSalarieesPeriodeAugmentation: number | undefined,
  nombreSalarieesAugmentees: number | undefined,
): number | undefined =>
  indicateurCalculable &&
  nombreSalarieesPeriodeAugmentation !== undefined &&
  nombreSalarieesAugmentees !== undefined &&
  nombreSalarieesPeriodeAugmentation >= nombreSalarieesAugmentees
    ? Math.abs(roundDecimal(100 * (nombreSalarieesAugmentees / nombreSalarieesPeriodeAugmentation), 3))
    : undefined

// NOTE
export const calculNote = (indicateurEcartNombreSalarieesAugmentees: number | undefined): number | undefined =>
  indicateurEcartNombreSalarieesAugmentees !== undefined
    ? indicateurEcartNombreSalarieesAugmentees < 100
      ? 0
      : 15
    : undefined

/////////
// ALL //
/////////

export default function calculerIndicateurQuatre(state: AppState) {
  const indicateurCalculable = calculIndicateurCalculable(
    state.indicateurQuatre.presenceCongeMat,
    state.indicateurQuatre.nombreSalarieesPeriodeAugmentation,
  )

  const indicateurEcartNombreSalarieesAugmentees = calculIndicateurEcartNombreSalarieesAugmentees(
    indicateurCalculable,
    state.indicateurQuatre.nombreSalarieesPeriodeAugmentation,
    state.indicateurQuatre.nombreSalarieesAugmentees,
  )

  const noteIndicateurQuatre = calculNote(indicateurEcartNombreSalarieesAugmentees)

  const messageNonCalculable =
    state.indicateurQuatre.presenceCongeMat &&
    state.indicateurQuatre.nombreSalarieesPeriodeAugmentation !== undefined &&
    state.indicateurQuatre.nombreSalarieesPeriodeAugmentation === 0
      ? "Il n’y a pas eu d’augmentations salariales pendant la durée du ou des congés maternité."
      : "Il n’y a pas eu de retour de congé maternité pendant la période de référence."

  return {
    indicateurCalculable,
    indicateurEcartNombreSalarieesAugmentees,
    noteIndicateurQuatre,
    messageNonCalculable,
  }
}
