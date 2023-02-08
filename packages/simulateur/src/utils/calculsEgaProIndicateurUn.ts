import {
  AppState,
  TrancheAge,
  CSP,
  EffectifsCategorie,
  GroupeIndicateurUn,
  GroupeCoefficient,
  GroupTranchesAgesIndicateurUn,
  GroupTranchesAgesEffectif,
  SexeType,
  GroupTranchesAgesCoefficient,
} from "../globals"

import {
  calculEcartsPonderesParGroupe,
  calculerTotalEcartPondere,
  calculerTotalEffectifs,
  calculerEffectifsParTrancheAge,
  EffectifGroup,
  effectifEstCalculable,
} from "./calculsEgaPro"
import { roundDecimal } from "./number"

/* INDICATEUR 1 CONST */

const seuilPertinenceCsp = 5 / 100
const seuilPertinenceCoef = 2 / 100

const baremeEcartRemuneration = [40, 39, 38, 37, 36, 35, 34, 33, 31, 29, 27, 25, 23, 21, 19, 17, 14, 11, 8, 5, 2, 0]

//////////////////
// COMMON ////////
//////////////////

export {
  calculerTotalEffectifs,
  calculerTotalEcartPondere, // TEV
  effectifEstCalculable, // IC
}

//////////////////
// INDICATEUR 1 //
//////////////////

// VG
export const calculerValiditeGroupe = (nombreSalariesFemmes: number, nombreSalariesHommes: number): boolean =>
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
export const calculerEcartTauxRemunerationParTrancheAgeCSP = (remunerationAnnuelle: GroupeIndicateurUn[]) =>
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

export const calculerEcartTauxRemunerationParTrancheAgeCoef = (coefficient: GroupeCoefficient[]) =>
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

export type FlatGroupTranchesAgesCsp = GroupTranchesAgesEffectif & { categorieSocioPro: CSP }

export const calculerEffectifsEtEcartRemuParTrancheAgeCsp = (
  dataEffectif: EffectifsCategorie[],
  dataIndicateurUn: GroupeIndicateurUn[],
): EffectifEtEcartRemuGroupCsp[] => {
  const dataEffectifByRow = dataEffectif.reduce(
    (acc: Array<FlatGroupTranchesAgesCsp>, { categorieSocioPro, tranchesAges }) =>
      acc.concat(tranchesAges.map((trancheAge) => ({ ...trancheAge, categorieSocioPro }))),
    [],
  )
  const dataIndicateurUnByRow = dataIndicateurUn.reduce(
    (acc: Array<GroupTranchesAgesIndicateurUn>, group) => acc.concat(group.tranchesAges),
    [],
  )

  const computedDataByRow = dataEffectifByRow.map((groupTrancheAgeEffectif, index: number) => {
    const groupTrancheAgeIndicateurUn = dataIndicateurUnByRow[index]

    const remunerationAnnuelleBrutFemmes =
      groupTrancheAgeIndicateurUn && groupTrancheAgeIndicateurUn.remunerationAnnuelleBrutFemmes
    const remunerationAnnuelleBrutHommes =
      groupTrancheAgeIndicateurUn && groupTrancheAgeIndicateurUn.remunerationAnnuelleBrutHommes

    const effectifs = calculerEffectifsParTrancheAge(groupTrancheAgeEffectif, calculerValiditeGroupe)

    // ERM
    const ecartRemunerationMoyenne = calculerEcartRemunerationMoyenne(
      remunerationAnnuelleBrutFemmes || 0,
      remunerationAnnuelleBrutHommes || 0,
    )
    // ESP
    const ecartApresApplicationSeuilPertinence =
      calculerEcartApresApplicationSeuilPertinenceCsp(ecartRemunerationMoyenne)

    return {
      ...effectifs,
      trancheAge: groupTrancheAgeEffectif.trancheAge,
      categorieSocioPro: groupTrancheAgeEffectif.categorieSocioPro,
      remunerationAnnuelleBrutFemmes,
      remunerationAnnuelleBrutHommes,
      ecartRemunerationMoyenne,
      ecartApresApplicationSeuilPertinence,
    }
  })

  return computedDataByRow
}

export const calculerEffectifsEtEcartRemuParTrancheAgeCoef = (
  coefficient: GroupeCoefficient[],
): EffectifEtEcartRemuGroupCoef[] => {
  const dataCoefficientByRow = coefficient.reduce<Array<GroupTranchesAgesCoefficient & { name: string; id: number }>>(
    (acc, { name, tranchesAges }, id) => acc.concat(tranchesAges.map((trancheAge) => ({ ...trancheAge, name, id }))),
    [],
  )

  const computedDataByRow = dataCoefficientByRow.map((groupTrancheAgeCoef) => {
    const remunerationAnnuelleBrutFemmes = groupTrancheAgeCoef.remunerationAnnuelleBrutFemmes
    const remunerationAnnuelleBrutHommes = groupTrancheAgeCoef.remunerationAnnuelleBrutHommes

    const effectifs = calculerEffectifsParTrancheAge(groupTrancheAgeCoef, calculerValiditeGroupe)

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
