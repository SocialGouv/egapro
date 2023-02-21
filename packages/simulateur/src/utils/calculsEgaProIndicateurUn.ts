import {
  AppState,
  CoefficientGroupe,
  CoefficientPourTrancheAge,
  CSP,
  EffectifPourTrancheAge,
  EffectifsPourCSP,
  RemunerationPourTrancheAge,
  RemunerationsPourCSP,
  SexeType,
  TrancheAge,
} from "../globals"

import {
  calculEcartsPonderesParGroupe,
  calculerTotalEcartPondere,
  calculerTotalEffectifs,
  effectifEstCalculable,
  EffectifGroup,
  nombreEffectifsValides,
} from "./calculsEgaPro"
import { roundDecimal } from "./number"

/*
 * Indicateur 1: écart de rémunération
 *
 * Cet indicateur est lié aux effectifs renseignés dans la page Effectif.
 * Soit l'utilisateur utilise les 4 groupes CSP prédéfinis (choix CSP), soit il choisit de créer ses propres groupes (les 2 choix par coefficient).
 *
 * Les 2 modes par coefficients n'ont pas de différences de règles par la suite.
 *
 */

const seuilPertinenceCsp = 5 / 100
const seuilPertinenceCoef = 2 / 100

const baremeEcartRemuneration = [40, 39, 38, 37, 36, 35, 34, 33, 31, 29, 27, 25, 23, 21, 19, 17, 14, 11, 8, 5, 2, 0]

// VG
export const calculerValiditeGroupe3 = (nombreSalariesFemmes: number, nombreSalariesHommes: number): boolean =>
  nombreSalariesFemmes >= 3 && nombreSalariesHommes >= 3

// ERM
export const calculerEcartRemunerationMoyenne = (
  remunerationAnnuelleBrutFemmes: number,
  remunerationAnnuelleBrutHommes: number,
): number | undefined =>
  remunerationAnnuelleBrutFemmes > 0 && remunerationAnnuelleBrutHommes > 0
    ? roundDecimal(
        (remunerationAnnuelleBrutHommes - remunerationAnnuelleBrutFemmes) / remunerationAnnuelleBrutHommes,
        6,
      )
    : undefined

// ESP
const calculerEcartApresApplicationSeuilPertinence = (
  ecartRemunerationMoyenne: number | undefined,
  seuilPertinence: number,
): number | undefined =>
  ecartRemunerationMoyenne !== undefined
    ? roundDecimal(
        Math.sign(ecartRemunerationMoyenne) * Math.max(0, Math.abs(ecartRemunerationMoyenne) - seuilPertinence),
        6,
      )
    : undefined

export const calculerEcartApresApplicationSeuilPertinenceCsp = (
  ecartRemunerationMoyenne?: number,
): number | undefined => calculerEcartApresApplicationSeuilPertinence(ecartRemunerationMoyenne, seuilPertinenceCsp)

export const calculerEcartApresApplicationSeuilPertinenceCoef = (
  ecartRemunerationMoyenne?: number,
): number | undefined => calculerEcartApresApplicationSeuilPertinence(ecartRemunerationMoyenne, seuilPertinenceCoef)

export type EffectifEtEcartRemuGroupCsp = EffectifGroup & {
  categorieSocioPro: CSP
  trancheAge: TrancheAge
  remunerationAnnuelleBrutFemmes?: number
  remunerationAnnuelleBrutHommes?: number
  ecartRemunerationMoyenne?: number
  ecartApresApplicationSeuilPertinence?: number
}

export type EffectifEtEcartRemuGroupCoef = EffectifGroup & {
  id: any
  name: string
  trancheAge: TrancheAge
  remunerationAnnuelleBrutFemmes?: number
  remunerationAnnuelleBrutHommes?: number
  ecartRemunerationMoyenne?: number
  ecartApresApplicationSeuilPertinence?: number
}

// Ajout de l'écart de rémunération moyenne dans les données "par niveau" (CSP ou coefficient) de l'indicateur
export const calculerEcartTauxRemunerationParTrancheAgeCSP = (remunerationAnnuelle: RemunerationsPourCSP[]) =>
  remunerationAnnuelle.map((categorie) => {
    return {
      ...categorie,
      tranchesAges: categorie.tranchesAges.map((trancheAge) => {
        return {
          ...trancheAge,
          ecartTauxRemuneration: calculerEcartRemunerationMoyenne(
            trancheAge.remunerationAnnuelleBrutFemmes || 0,
            trancheAge.remunerationAnnuelleBrutHommes || 0,
          ),
        }
      }),
    }
  })

export const calculerEcartTauxRemunerationParTrancheAgeCoef = (coefficient: CoefficientGroupe[]) =>
  coefficient.map((niveau) => {
    return {
      ...niveau,
      tranchesAges: niveau.tranchesAges.map((trancheAge) => {
        return {
          ...trancheAge,
          ecartTauxRemuneration: calculerEcartRemunerationMoyenne(
            trancheAge.remunerationAnnuelleBrutFemmes || 0,
            trancheAge.remunerationAnnuelleBrutHommes || 0,
          ),
        }
      }),
    }
  })

export const calculerEffectifsParTrancheAge = ({
  nombreSalariesFemmes,
  nombreSalariesHommes,
}: EffectifPourTrancheAge): EffectifGroup => {
  nombreSalariesFemmes = nombreSalariesFemmes || 0
  nombreSalariesHommes = nombreSalariesHommes || 0

  // VG
  const validiteGroupe = calculerValiditeGroupe3(nombreSalariesFemmes, nombreSalariesHommes)

  return {
    nombreSalariesFemmes,
    nombreSalariesHommes,
    validiteGroupe,
    // EV
    effectifsValides: nombreEffectifsValides(validiteGroupe, nombreSalariesFemmes, nombreSalariesHommes),
  }
}

export type FlatGroupTranchesAgesCsp = EffectifPourTrancheAge & { categorieSocioPro: CSP }

export const calculerEffectifsEtEcartRemuParTrancheAgeCsp = (
  effectifs: EffectifsPourCSP[],
  remunerations: RemunerationsPourCSP[],
): EffectifEtEcartRemuGroupCsp[] => {
  const flatEffectifs = effectifs.reduce(
    (acc: Array<FlatGroupTranchesAgesCsp>, { categorieSocioPro, tranchesAges }) =>
      acc.concat(tranchesAges.map((trancheAge) => ({ ...trancheAge, categorieSocioPro }))),
    [],
  )
  const flatRemunerations = remunerations.reduce(
    (acc: Array<RemunerationPourTrancheAge>, group) => acc.concat(group.tranchesAges),
    [],
  )

  const computedDataByRow = flatEffectifs.map((effectif, index: number) => {
    const remuneration = flatRemunerations[index]

    const remunerationAnnuelleBrutFemmes = remuneration?.remunerationAnnuelleBrutFemmes
    const remunerationAnnuelleBrutHommes = remuneration?.remunerationAnnuelleBrutHommes

    const effectifsParTrancheAge = calculerEffectifsParTrancheAge(effectif)

    // ERM
    const ecartRemunerationMoyenne = calculerEcartRemunerationMoyenne(
      remunerationAnnuelleBrutFemmes || 0,
      remunerationAnnuelleBrutHommes || 0,
    )
    // ESP
    const ecartApresApplicationSeuilPertinence =
      calculerEcartApresApplicationSeuilPertinenceCsp(ecartRemunerationMoyenne)

    return {
      ...effectifsParTrancheAge,
      trancheAge: effectif.trancheAge,
      categorieSocioPro: effectif.categorieSocioPro,
      remunerationAnnuelleBrutFemmes,
      remunerationAnnuelleBrutHommes,
      ecartRemunerationMoyenne,
      ecartApresApplicationSeuilPertinence,
    }
  })

  return computedDataByRow
}

export const calculerEffectifsEtEcartRemuParTrancheAgeCoef = (
  coefficient: CoefficientGroupe[],
): EffectifEtEcartRemuGroupCoef[] => {
  const dataCoefficientByRow = coefficient.reduce<Array<CoefficientPourTrancheAge & { name: string; id: number }>>(
    (acc, { name, tranchesAges }, id) => acc.concat(tranchesAges.map((trancheAge) => ({ ...trancheAge, name, id }))),
    [],
  )

  const computedDataByRow = dataCoefficientByRow.map((groupTrancheAgeCoef) => {
    const remunerationAnnuelleBrutFemmes = groupTrancheAgeCoef.remunerationAnnuelleBrutFemmes
    const remunerationAnnuelleBrutHommes = groupTrancheAgeCoef.remunerationAnnuelleBrutHommes

    const effectifs = calculerEffectifsParTrancheAge(groupTrancheAgeCoef)

    // ERM
    const ecartRemunerationMoyenne = calculerEcartRemunerationMoyenne(
      remunerationAnnuelleBrutFemmes || 0,
      remunerationAnnuelleBrutHommes || 0,
    )
    // ESP
    const ecartApresApplicationSeuilPertinence =
      calculerEcartApresApplicationSeuilPertinenceCoef(ecartRemunerationMoyenne)

    return {
      ...effectifs,
      id: groupTrancheAgeCoef.id,
      name: groupTrancheAgeCoef.name,
      trancheAge: groupTrancheAgeCoef.trancheAge,

      remunerationAnnuelleBrutFemmes,
      remunerationAnnuelleBrutHommes,
      ecartRemunerationMoyenne,
      ecartApresApplicationSeuilPertinence,
    }
  })

  return computedDataByRow
}

export const calculerEcartsPonderesParTrancheAge = calculEcartsPonderesParGroupe(
  ({ ecartApresApplicationSeuilPertinence }) => ecartApresApplicationSeuilPertinence,
)

// IER
export const calculerEcartRemuneration = (
  indicateurCalculable: boolean,
  totalEcartPondere?: number,
): number | undefined =>
  indicateurCalculable && totalEcartPondere !== undefined ? roundDecimal(100 * totalEcartPondere, 6) : undefined

export const calculerSexeSousRepresente = (indicateurEcartRemuneration?: number): SexeType | undefined => {
  if (indicateurEcartRemuneration === undefined || indicateurEcartRemuneration === 0) {
    return undefined
  }
  return Math.sign(indicateurEcartRemuneration) < 0 ? "femmes" : "hommes"
}

export const calculerEcartRemunerationAbsolu = (indicateurEcartRemuneration?: number): number | undefined =>
  indicateurEcartRemuneration !== undefined ? Math.abs(indicateurEcartRemuneration) : undefined

// NOTE
export const calculerNote = (indicateurEcartRemuneration?: number): number | undefined =>
  indicateurEcartRemuneration !== undefined
    ? baremeEcartRemuneration[
        Math.min(
          baremeEcartRemuneration.length - 1,
          Math.ceil(Math.max(0, roundDecimal(indicateurEcartRemuneration, 1))),
        )
      ]
    : undefined

/////////
// ALL //
/////////

export default function calculerIndicateurUn(state: AppState) {
  const effectifEtEcartRemuParTrancheCsp = calculerEffectifsEtEcartRemuParTrancheAgeCsp(
    state.effectif.nombreSalaries,
    state.indicateurUn.remunerationAnnuelle,
  )

  const effectifEtEcartRemuParTrancheCoef = calculerEffectifsEtEcartRemuParTrancheAgeCoef(
    state.indicateurUn.coefficient,
  )

  const effectifEtEcartRemuParTranche = state.indicateurUn.csp
    ? effectifEtEcartRemuParTrancheCsp
    : effectifEtEcartRemuParTrancheCoef

  const { totalNombreSalaries, totalEffectifsValides } = calculerTotalEffectifs(effectifEtEcartRemuParTranche)

  const ecartsPonderesByRow = calculerEcartsPonderesParTrancheAge(effectifEtEcartRemuParTranche, totalEffectifsValides)

  // TEP
  const totalEcartPondere = calculerTotalEcartPondere(ecartsPonderesByRow)

  // IC
  const effectifsIndicateurCalculable = effectifEstCalculable(totalNombreSalaries, totalEffectifsValides)

  // IER
  const indicateurEcartRemuneration = calculerEcartRemuneration(effectifsIndicateurCalculable, totalEcartPondere)

  const indicateurEcartRemunerationAbsolu = calculerEcartRemunerationAbsolu(indicateurEcartRemuneration)

  const indicateurSexeSurRepresente = calculerSexeSousRepresente(indicateurEcartRemuneration)

  // NOTE
  const noteIndicateurUn = calculerNote(indicateurEcartRemunerationAbsolu)

  return {
    effectifEtEcartRemuParTrancheCsp,
    effectifEtEcartRemuParTrancheCoef,
    effectifEtEcartRemuParTranche,
    effectifsIndicateurCalculable,
    indicateurEcartRemuneration: indicateurEcartRemunerationAbsolu,
    indicateurSexeSurRepresente,
    noteIndicateurUn,
  }
}
