import { EffectifsPourCSP, EffectifPourTrancheAge, SexeType } from "../globals"
import { roundDecimal } from "./number"

export const tauxEffectifValide = 40 / 100

//////////////////
// COMMON ////////
//////////////////

// EV
export const nombreEffectifsValides = (
  validiteGroupe: boolean,
  nombreSalariesFemmes: number,
  nombreSalariesHommes: number,
): number => (validiteGroupe ? nombreSalariesFemmes + nombreSalariesHommes : 0)

// EP
export const calculEcartPondere = (
  ecartPourcentage: number | undefined,
  effectifsValides: number,
  totalEffectifsValides: number,
): number | undefined =>
  totalEffectifsValides > 0 && ecartPourcentage !== undefined
    ? roundDecimal((ecartPourcentage * effectifsValides) / totalEffectifsValides, 6)
    : undefined

type EffectifEtEcart = {
  validiteGroupe: boolean
  effectifsValides: number
  ecartApresApplicationSeuilPertinence?: number
  ecartTauxAugmentation?: number
  ecartTauxPromotion?: number
  ecartTauxAugmentationPromotion?: number
}

type FindEcartFn = (effectifEtEcart: EffectifEtEcart) => number | undefined

export const calculEcartsPonderesParGroupe =
  (findEcartPourcentage: FindEcartFn) => (groupEffectifEtEcart: EffectifEtEcart[], totalEffectifsValides: number) =>
    groupEffectifEtEcart
      .filter(({ validiteGroupe }) => validiteGroupe)
      .map((effectifEtEcart) => {
        const ecartPourcentage = findEcartPourcentage(effectifEtEcart)
        const { effectifsValides } = effectifEtEcart
        // EP
        return calculEcartPondere(ecartPourcentage, effectifsValides, totalEffectifsValides)
      })

// TEP
export const calculerTotalEcartPondere = (tableauEcartsPonderes: Array<number | undefined>): number | undefined =>
  tableauEcartsPonderes.length === 0 || tableauEcartsPonderes.includes(undefined)
    ? undefined
    : roundDecimal((tableauEcartsPonderes as number[]).reduce((acc, val) => acc + val, 0) || 0, 6)

//////////////////
// EFFECTIFS /////
//////////////////

export type EffectifGroup = {
  nombreSalariesFemmes: number
  nombreSalariesHommes: number
  validiteGroupe: boolean
  effectifsValides: number
}

export const calculerEffectifsParTrancheAge = (
  { nombreSalariesFemmes, nombreSalariesHommes }: EffectifPourTrancheAge,
  calculValiditeGroupe: (nombreSalariesFemmes: number, nombreSalariesHommes: number) => boolean,
): EffectifGroup => {
  nombreSalariesFemmes = nombreSalariesFemmes || 0
  nombreSalariesHommes = nombreSalariesHommes || 0

  // VG
  const validiteGroupe = calculValiditeGroupe(nombreSalariesFemmes, nombreSalariesHommes)

  return {
    nombreSalariesFemmes,
    nombreSalariesHommes,
    validiteGroupe,
    // EV
    effectifsValides: nombreEffectifsValides(validiteGroupe, nombreSalariesFemmes, nombreSalariesHommes),
  }
}

export const calculerEffectifsParCSP = (
  categorie: EffectifsPourCSP,
  calculValiditeGroupe: (nombreSalariesFemmes: number, nombreSalariesHommes: number) => boolean,
): EffectifGroup => {
  const { nombreSalariesFemmesGroupe, nombreSalariesHommesGroupe } = categorie.tranchesAges.reduce(
    ({ nombreSalariesFemmesGroupe, nombreSalariesHommesGroupe }, { nombreSalariesFemmes, nombreSalariesHommes }) => ({
      nombreSalariesFemmesGroupe: nombreSalariesFemmesGroupe + (nombreSalariesFemmes || 0),
      nombreSalariesHommesGroupe: nombreSalariesHommesGroupe + (nombreSalariesHommes || 0),
    }),
    { nombreSalariesFemmesGroupe: 0, nombreSalariesHommesGroupe: 0 },
  )

  // VG
  const validiteGroupe = calculValiditeGroupe(nombreSalariesFemmesGroupe, nombreSalariesHommesGroupe)

  return {
    nombreSalariesFemmes: nombreSalariesFemmesGroupe,
    nombreSalariesHommes: nombreSalariesHommesGroupe,
    validiteGroupe,
    // EV
    effectifsValides: nombreEffectifsValides(validiteGroupe, nombreSalariesFemmesGroupe, nombreSalariesHommesGroupe),
  }
}

export const calculerTotalEffectifs = (groupEffectif: Array<EffectifGroup>) => {
  const { totalNombreSalariesFemmes, totalNombreSalariesHommes } = groupEffectif.reduce(
    ({ totalNombreSalariesFemmes, totalNombreSalariesHommes }, { nombreSalariesFemmes, nombreSalariesHommes }) => {
      return {
        totalNombreSalariesFemmes: totalNombreSalariesFemmes + nombreSalariesFemmes,
        totalNombreSalariesHommes: totalNombreSalariesHommes + nombreSalariesHommes,
      }
    },
    {
      totalNombreSalariesFemmes: 0, //TNBF
      totalNombreSalariesHommes: 0, //TNBH
    },
  )

  // TNB
  const totalNombreSalaries = totalNombreSalariesFemmes + totalNombreSalariesHommes

  // TEV
  const totalEffectifsValides = groupEffectif.reduce((acc, { effectifsValides }) => acc + effectifsValides, 0)

  return {
    totalNombreSalariesFemmes,
    totalNombreSalariesHommes,
    totalNombreSalaries,
    totalEffectifsValides,
  }
}

/**
 * IC
 *
 * Vrai si le nombre de salariés est supérieur à 0 et que le nombre d'effectifs valides est supérieur à 40% du nombre de salariés.
 *
 */
export const effectifEstCalculable = (totalNombreSalaries: number, totalEffectifsValides: number): boolean =>
  totalNombreSalaries > 0 && totalEffectifsValides >= totalNombreSalaries * tauxEffectifValide

export const calculerPlusPetitNbSalaries = (
  totalNombreSalariesHommes?: number,
  totalNombreSalariesFemmes?: number,
): SexeType | undefined => {
  if (
    totalNombreSalariesFemmes === totalNombreSalariesHommes ||
    totalNombreSalariesFemmes === undefined ||
    totalNombreSalariesHommes === undefined
  ) {
    return undefined
  }
  return totalNombreSalariesHommes > totalNombreSalariesFemmes ? "femmes" : "hommes"
}
