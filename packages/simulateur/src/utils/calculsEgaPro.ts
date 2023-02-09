import { EffectifsPourCSP, SexeType } from "../globals"
import { calculerValiditeGroupe10 } from "./calculsEgaProIndicateurDeux"
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

// Utilisé pour les indicateurs 1, 2 et 3. Sert à calculer des moyennes en ne prenant pas en compte les groupes non valides.
export const calculEcartsPonderesParGroupe =
  (findEcartPourcentage: FindEcartFn) => (groupEffectifEtEcart: EffectifEtEcart[], totalEffectifsValides: number) =>
    groupEffectifEtEcart
      .filter(({ validiteGroupe }) => validiteGroupe)
      .map((effectifEtEcart) => {
        const { effectifsValides } = effectifEtEcart
        const ecartPourcentage = findEcartPourcentage(effectifEtEcart)

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

export const calculerEffectifsParCSP = (categorie: EffectifsPourCSP): EffectifGroup => {
  const { nombreSalariesFemmesGroupe, nombreSalariesHommesGroupe } = categorie.tranchesAges.reduce(
    ({ nombreSalariesFemmesGroupe, nombreSalariesHommesGroupe }, { nombreSalariesFemmes, nombreSalariesHommes }) => ({
      nombreSalariesFemmesGroupe: nombreSalariesFemmesGroupe + (nombreSalariesFemmes || 0),
      nombreSalariesHommesGroupe: nombreSalariesHommesGroupe + (nombreSalariesHommes || 0),
    }),
    { nombreSalariesFemmesGroupe: 0, nombreSalariesHommesGroupe: 0 },
  )

  // VG
  const validiteGroupe = calculerValiditeGroupe10(nombreSalariesFemmesGroupe, nombreSalariesHommesGroupe)

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
    (acc, { nombreSalariesFemmes, nombreSalariesHommes }) => {
      return {
        totalNombreSalariesFemmes: acc.totalNombreSalariesFemmes + nombreSalariesFemmes,
        totalNombreSalariesHommes: acc.totalNombreSalariesHommes + nombreSalariesHommes,
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
