import {
  AppState,
  TranchesAges,
  CategorieSocioPro,
  GroupeEffectif,
  GroupeIndicateurUn,
  GroupeCoefficient,
  GroupTranchesAgesIndicateurUn,
  GroupTranchesAgesEffectif,
} from "../globals"

import {
  calculEcartsPonderesParGroupe,
  calculTotalEcartPondere,
  calculTotalEffectifs,
  rowEffectifsParTrancheAge,
  EffectifGroup,
  calculEffectifsIndicateurCalculable,
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
  calculTotalEffectifs,
  calculTotalEcartPondere, // TEV
  calculEffectifsIndicateurCalculable, // IC
}

//////////////////
// INDICATEUR 1 //
//////////////////

// VG
export const calculValiditeGroupe = (nombreSalariesFemmes: number, nombreSalariesHommes: number): boolean =>
  nombreSalariesFemmes >= 3 && nombreSalariesHommes >= 3

// ERM
export const calculEcartRemunerationMoyenne = (
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
const calculEcartApresApplicationSeuilPertinence = (
  ecartRemunerationMoyenne: number | undefined,
  seuilPertinence: number,
): number | undefined =>
  ecartRemunerationMoyenne !== undefined
    ? roundDecimal(
        Math.sign(ecartRemunerationMoyenne) * Math.max(0, Math.abs(ecartRemunerationMoyenne) - seuilPertinence),
        6,
      )
    : undefined

export const calculEcartApresApplicationSeuilPertinenceCsp = (
  ecartRemunerationMoyenne: number | undefined,
): number | undefined => calculEcartApresApplicationSeuilPertinence(ecartRemunerationMoyenne, seuilPertinenceCsp)

export const calculEcartApresApplicationSeuilPertinenceCoef = (
  ecartRemunerationMoyenne: number | undefined,
): number | undefined => calculEcartApresApplicationSeuilPertinence(ecartRemunerationMoyenne, seuilPertinenceCoef)

export interface effectifEtEcartRemuGroupCsp extends EffectifGroup {
  categorieSocioPro: CategorieSocioPro
  trancheAge: TranchesAges
  remunerationAnnuelleBrutFemmes: number | undefined
  remunerationAnnuelleBrutHommes: number | undefined
  ecartRemunerationMoyenne: number | undefined
  ecartApresApplicationSeuilPertinence: number | undefined
}

export interface effectifEtEcartRemuGroupCoef extends EffectifGroup {
  id: any
  name: string
  trancheAge: TranchesAges
  remunerationAnnuelleBrutFemmes: number | undefined
  remunerationAnnuelleBrutHommes: number | undefined
  ecartRemunerationMoyenne: number | undefined
  ecartApresApplicationSeuilPertinence: number | undefined
}

export interface tmpGroupTranchesAgesCoef {
  id: any
  name: string
  trancheAge: TranchesAges
  nombreSalariesFemmes: number | undefined
  nombreSalariesHommes: number | undefined
  remunerationAnnuelleBrutFemmes: number | undefined
  remunerationAnnuelleBrutHommes: number | undefined
}

// Ajout de l'écart de rémunération moyenne dans les données "par niveau" (CSP ou coefficient) de l'indicateur
export const calculEcartTauxRemunerationParTrancheAgeCSP = (remunerationAnnuelle: Array<GroupeIndicateurUn>) =>
  remunerationAnnuelle.map((categorie) => {
    return {
      ...categorie,
      tranchesAges: categorie.tranchesAges.map((trancheAge) => {
        return {
          ...trancheAge,
          ecartTauxRemuneration: calculEcartRemunerationMoyenne(
            trancheAge.remunerationAnnuelleBrutFemmes || 0,
            trancheAge.remunerationAnnuelleBrutHommes || 0,
          ),
        }
      }),
    }
  })

export const calculEcartTauxRemunerationParTrancheAgeCoef = (coefficient: Array<GroupeCoefficient>) =>
  coefficient.map((niveau) => {
    return {
      ...niveau,
      tranchesAges: niveau.tranchesAges.map((trancheAge) => {
        return {
          ...trancheAge,
          ecartTauxRemuneration: calculEcartRemunerationMoyenne(
            trancheAge.remunerationAnnuelleBrutFemmes || 0,
            trancheAge.remunerationAnnuelleBrutHommes || 0,
          ),
        }
      }),
    }
  })

export type FlatGroupTranchesAgesCsp = GroupTranchesAgesEffectif & { categorieSocioPro: CategorieSocioPro }

export const calculEffectifsEtEcartRemuParTrancheAgeCsp = (
  dataEffectif: Array<GroupeEffectif>,
  dataIndicateurUn: Array<GroupeIndicateurUn>,
): Array<effectifEtEcartRemuGroupCsp> => {
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

    const effectifs = rowEffectifsParTrancheAge(groupTrancheAgeEffectif, calculValiditeGroupe)

    // ERM
    const ecartRemunerationMoyenne = calculEcartRemunerationMoyenne(
      remunerationAnnuelleBrutFemmes || 0,
      remunerationAnnuelleBrutHommes || 0,
    )
    // ESP
    const ecartApresApplicationSeuilPertinence = calculEcartApresApplicationSeuilPertinenceCsp(ecartRemunerationMoyenne)

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

export const calculEffectifsEtEcartRemuParTrancheAgeCoef = (
  coefficient: Array<GroupeCoefficient>,
): Array<effectifEtEcartRemuGroupCoef> => {
  const dataCoefficientByRow = coefficient.reduce(
    (acc: Array<tmpGroupTranchesAgesCoef>, { name, tranchesAges }, index) =>
      acc.concat(tranchesAges.map((trancheAge) => ({ ...trancheAge, name, id: index }))),
    [],
  )

  const computedDataByRow = dataCoefficientByRow.map((groupTrancheAgeCoef: tmpGroupTranchesAgesCoef) => {
    const remunerationAnnuelleBrutFemmes = groupTrancheAgeCoef && groupTrancheAgeCoef.remunerationAnnuelleBrutFemmes
    const remunerationAnnuelleBrutHommes = groupTrancheAgeCoef && groupTrancheAgeCoef.remunerationAnnuelleBrutHommes

    const effectifs = rowEffectifsParTrancheAge(groupTrancheAgeCoef, calculValiditeGroupe)

    // ERM
    const ecartRemunerationMoyenne = calculEcartRemunerationMoyenne(
      remunerationAnnuelleBrutFemmes || 0,
      remunerationAnnuelleBrutHommes || 0,
    )
    // ESP
    const ecartApresApplicationSeuilPertinence =
      calculEcartApresApplicationSeuilPertinenceCoef(ecartRemunerationMoyenne)

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

export const calculEcartsPonderesParTrancheAge = calculEcartsPonderesParGroupe(
  ({ ecartApresApplicationSeuilPertinence }) => ecartApresApplicationSeuilPertinence,
)

// IER
export const calculIndicateurEcartRemuneration = (
  indicateurCalculable: boolean,
  totalEcartPondere: number | undefined,
): number | undefined =>
  indicateurCalculable && totalEcartPondere !== undefined ? roundDecimal(100 * totalEcartPondere, 6) : undefined

export const calculIndicateurSexeSousRepresente = (
  indicateurEcartRemuneration: number | undefined,
): "hommes" | "femmes" | undefined => {
  if (indicateurEcartRemuneration === undefined || indicateurEcartRemuneration === 0) {
    return undefined
  }
  return Math.sign(indicateurEcartRemuneration) < 0 ? "femmes" : "hommes"
}

export const calculIndicateurEcartRemunerationAbsolute = (
  indicateurEcartRemuneration: number | undefined,
): number | undefined => (indicateurEcartRemuneration !== undefined ? Math.abs(indicateurEcartRemuneration) : undefined)

// NOTE
export const calculNote = (indicateurEcartRemuneration: number | undefined): number | undefined =>
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
  const effectifEtEcartRemuParTrancheCsp = calculEffectifsEtEcartRemuParTrancheAgeCsp(
    state.effectif.nombreSalaries,
    state.indicateurUn.remunerationAnnuelle,
  )

  const effectifEtEcartRemuParTrancheCoef = calculEffectifsEtEcartRemuParTrancheAgeCoef(state.indicateurUn.coefficient)

  const effectifEtEcartRemuParTranche = state.indicateurUn.csp
    ? effectifEtEcartRemuParTrancheCsp
    : effectifEtEcartRemuParTrancheCoef

  const { totalNombreSalaries, totalEffectifsValides } = calculTotalEffectifs(effectifEtEcartRemuParTranche)

  const ecartsPonderesByRow = calculEcartsPonderesParTrancheAge(effectifEtEcartRemuParTranche, totalEffectifsValides)

  // TEP
  const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow)

  // IC
  const effectifsIndicateurCalculable = calculEffectifsIndicateurCalculable(totalNombreSalaries, totalEffectifsValides)

  // IER
  const indicateurEcartRemuneration = calculIndicateurEcartRemuneration(
    effectifsIndicateurCalculable,
    totalEcartPondere,
  )

  const indicateurEcartRemunerationAbsolute = calculIndicateurEcartRemunerationAbsolute(indicateurEcartRemuneration)

  const indicateurSexeSurRepresente = calculIndicateurSexeSousRepresente(indicateurEcartRemuneration)

  // NOTE
  const noteIndicateurUn = calculNote(indicateurEcartRemunerationAbsolute)

  return {
    effectifEtEcartRemuParTrancheCsp,
    effectifEtEcartRemuParTrancheCoef,
    effectifEtEcartRemuParTranche,
    effectifsIndicateurCalculable,
    indicateurEcartRemuneration: indicateurEcartRemunerationAbsolute,
    indicateurSexeSurRepresente,
    noteIndicateurUn,
  }
}
