import { AppState, SexeType } from "../globals"
import { clamp } from "./number"

/*
 * Indicateur 5: Nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations
 */

const baremeEcartRemuneration = [0, 0, 5, 5, 10, 10]

export const calculerSexeSousRepresente = (
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

export const calculerNbSalariesSexeSousRepresente = (
  nombreSalariesHommes: number | undefined,
  nombreSalariesFemmes: number | undefined,
): number | undefined =>
  nombreSalariesHommes !== undefined && nombreSalariesFemmes !== undefined
    ? Math.min(nombreSalariesHommes, nombreSalariesFemmes)
    : undefined

// NOTE
export const calculerNote = (indicateurNombreSalariesSexeSousRepresente?: number): number | undefined =>
  indicateurNombreSalariesSexeSousRepresente !== undefined
    ? baremeEcartRemuneration[clamp(indicateurNombreSalariesSexeSousRepresente, 0, baremeEcartRemuneration.length - 1)]
    : undefined

/////////
// ALL //
/////////

export default function calculerIndicateurCinq(state: AppState) {
  const indicateurSexeSousRepresente = calculerSexeSousRepresente(
    state.indicateurCinq.nombreSalariesHommes,
    state.indicateurCinq.nombreSalariesFemmes,
  )

  const indicateurNombreSalariesSexeSousRepresente = calculerNbSalariesSexeSousRepresente(
    state.indicateurCinq.nombreSalariesHommes,
    state.indicateurCinq.nombreSalariesFemmes,
  )

  const noteIndicateurCinq = calculerNote(indicateurNombreSalariesSexeSousRepresente)

  return {
    indicateurSexeSousRepresente,
    indicateurNombreSalariesSexeSousRepresente,
    noteIndicateurCinq,
  }
}

// ---------------------------------------------------------------------
// TODO: Refactor les calculs d'indicateur en mode OOP, comme ci-dessous.

type IndicateurCinquParams = Required<Pick<AppState["indicateurCinq"], "nombreSalariesHommes" | "nombreSalariesFemmes">>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class IndicateurCinq {
  private nombreSalariesFemmes: number
  private nombreSalariesHommes: number

  constructor({ nombreSalariesHommes, nombreSalariesFemmes }: IndicateurCinquParams) {
    if (nombreSalariesHommes === undefined || nombreSalariesFemmes === undefined)
      throw new Error("Not compliant data to build IndicateurCinq.")

    this.nombreSalariesHommes = nombreSalariesHommes
    this.nombreSalariesFemmes = nombreSalariesFemmes
  }

  get sexeSousRepresente(): { sexe: SexeType | "egalite"; ecart: number } {
    const ecartHommesFemmes = this.nombreSalariesHommes - this.nombreSalariesFemmes

    return ecartHommesFemmes > 0
      ? { sexe: "femmes", ecart: ecartHommesFemmes }
      : ecartHommesFemmes < 0
      ? { sexe: "hommes", ecart: -ecartHommesFemmes }
      : { sexe: "egalite", ecart: 0 }
  }

  get note(): number {
    return baremeEcartRemuneration[clamp(this.sexeSousRepresente.ecart, 0, baremeEcartRemuneration.length - 1)]
  }
}

// Usage:
// const indicateur5 = new IndicateurCinq({ nombreSalariesHommes: 10, nombreSalariesFemmes: 5 })
// const {
//   note,
//   sexeSousRepresente: { ecart, sexe },
// } = indicateur5

