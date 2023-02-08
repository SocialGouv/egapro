import { AppState, SexeType } from "../globals"

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num))
}

//////////////////
// INDICATEUR 5 //
//////////////////

const baremeEcartRemuneration = [0, 0, 5, 5, 10, 10]

export const calculIndicateurSexeSousRepresente = (
  nombreSalariesHommes: number | undefined,
  nombreSalariesFemmes: number | undefined,
): SexeType | "egalite" | undefined =>
  nombreSalariesHommes !== undefined && nombreSalariesFemmes !== undefined
    ? nombreSalariesHommes > nombreSalariesFemmes
      ? "femmes"
      : nombreSalariesHommes < nombreSalariesFemmes
      ? "hommes"
      : "egalite"
    : undefined

export const calculIndicateurNombreSalariesSexeSousRepresente = (
  nombreSalariesHommes: number | undefined,
  nombreSalariesFemmes: number | undefined,
): number | undefined =>
  nombreSalariesHommes !== undefined && nombreSalariesFemmes !== undefined
    ? Math.min(nombreSalariesHommes, nombreSalariesFemmes)
    : undefined

// NOTE
export const calculNote = (indicateurNombreSalariesSexeSousRepresente?: number): number | undefined =>
  indicateurNombreSalariesSexeSousRepresente !== undefined
    ? baremeEcartRemuneration[clamp(indicateurNombreSalariesSexeSousRepresente, 0, baremeEcartRemuneration.length - 1)]
    : undefined

/////////
// ALL //
/////////

export default function calculerIndicateurCinq(state: AppState) {
  const indicateurSexeSousRepresente = calculIndicateurSexeSousRepresente(
    state.indicateurCinq.nombreSalariesHommes,
    state.indicateurCinq.nombreSalariesFemmes,
  )

  const indicateurNombreSalariesSexeSousRepresente = calculIndicateurNombreSalariesSexeSousRepresente(
    state.indicateurCinq.nombreSalariesHommes,
    state.indicateurCinq.nombreSalariesFemmes,
  )

  const noteIndicateurCinq = calculNote(indicateurNombreSalariesSexeSousRepresente)

  return {
    indicateurSexeSousRepresente,
    indicateurNombreSalariesSexeSousRepresente,
    noteIndicateurCinq,
  }
}
