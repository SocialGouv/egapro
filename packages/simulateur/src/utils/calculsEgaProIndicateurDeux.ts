import { AppState, EffectifsCategorie, SexeType, TauxAugmentationParCSP } from "../globals"

import {
  calculEcartsPonderesParGroupe,
  effectifEstCalculable,
  calculerTotalEcartPondere,
  calculerTotalEffectifs,
  EffectifGroup,
  calculerEffectifsParCSP,
} from "./calculsEgaPro"
import calculerIndicateurUn from "./calculsEgaProIndicateurUn"
import { roundDecimal } from "./number"

const baremeEcartAugmentation = [20, 20, 20, 10, 10, 10, 5, 5, 5, 5, 5, 0]

//////////////////
// COMMON ////////
//////////////////

// export {
//   calculTotalEcartPondere,
//   calculEffectifsIndicateurCalculable, // IC
// }

//////////////////
// INDICATEUR 2 //
//////////////////

// VG
export const calculerValiditeGroupe = (nombreSalariesFemmes: number, nombreSalariesHommes: number): boolean =>
  nombreSalariesFemmes >= 10 && nombreSalariesHommes >= 10

// ETA
export const calculerEcartTauxAugmentation = (
  tauxAugmentationFemmes?: number,
  tauxAugmentationHommes?: number,
): number | undefined =>
  tauxAugmentationFemmes !== undefined &&
  tauxAugmentationHommes !== undefined &&
  tauxAugmentationFemmes >= 0 &&
  tauxAugmentationHommes >= 0
    ? roundDecimal(tauxAugmentationHommes - tauxAugmentationFemmes, 6)
    : undefined

type EffectifEtEcartAugmentGroup = EffectifGroup & TauxAugmentationParCSP

// Ajout de l'écart d'augmentation dans les données par CSP
export const calculerEcartTauxAugmentationParCSP = (tauxAugmentation: Array<TauxAugmentationParCSP>) =>
  tauxAugmentation.map((categorie) => {
    return {
      ...categorie,
      ecartTauxAugmentation: calculerEcartTauxAugmentation(
        categorie.tauxAugmentationFemmes,
        categorie.tauxAugmentationHommes,
      ),
    }
  })

export const calculerEffectifsEtEcartAugmentationParCSP = (
  effectifs: Array<EffectifsCategorie>,
  tauxAugmentationParCSP: Array<TauxAugmentationParCSP>,
): Array<EffectifEtEcartAugmentGroup> => {
  return effectifs.map((categorie: EffectifsCategorie) => {
    const { categorieSocioPro } = categorie

    const effectifs = calculerEffectifsParCSP(categorie, calculerValiditeGroupe)

    const tauxAugmentation = tauxAugmentationParCSP.find(
      ({ categorieSocioPro }) => categorieSocioPro === categorie.categorieSocioPro,
    )

    const tauxAugmentationFemmes = tauxAugmentation?.tauxAugmentationFemmes
    const tauxAugmentationHommes = tauxAugmentation?.tauxAugmentationHommes

    return {
      ...effectifs,
      categorieSocioPro,
      tauxAugmentationFemmes,
      tauxAugmentationHommes,
      // ETA
      ecartTauxAugmentation: calculerEcartTauxAugmentation(tauxAugmentationFemmes, tauxAugmentationHommes),
    }
  })
}

export const calculerTotalEffectifsEtTauxAugmentation = (
  groupEffectifEtEcartAugment: Array<EffectifEtEcartAugmentGroup>,
) => {
  const { totalNombreSalariesFemmes, totalNombreSalariesHommes, totalNombreSalaries, totalEffectifsValides } =
    calculerTotalEffectifs(groupEffectifEtEcartAugment)

  const { sommeProduitTauxAugmentationFemmes, sommeProduitTauxAugmentationHommes } = groupEffectifEtEcartAugment.reduce(
    (
      { sommeProduitTauxAugmentationFemmes, sommeProduitTauxAugmentationHommes },
      { nombreSalariesFemmes, nombreSalariesHommes, tauxAugmentationFemmes, tauxAugmentationHommes },
    ) => {
      return {
        sommeProduitTauxAugmentationFemmes:
          sommeProduitTauxAugmentationFemmes + (tauxAugmentationFemmes || 0) * nombreSalariesFemmes,
        sommeProduitTauxAugmentationHommes:
          sommeProduitTauxAugmentationHommes + (tauxAugmentationHommes || 0) * nombreSalariesHommes,
      }
    },
    {
      sommeProduitTauxAugmentationFemmes: 0,
      sommeProduitTauxAugmentationHommes: 0,
    },
  )

  // TTAF
  const totalTauxAugmentationFemmes = sommeProduitTauxAugmentationFemmes / totalNombreSalariesFemmes

  // TTAH
  const totalTauxAugmentationHommes = sommeProduitTauxAugmentationHommes / totalNombreSalariesHommes

  return {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes,
  }
}

export const calculerEcartsPonderesParCSP = calculEcartsPonderesParGroupe(
  ({ ecartTauxAugmentation }) => ecartTauxAugmentation,
)

// IC
export const estCalculable = (
  presenceAugmentation: boolean,
  totalNombreSalaries: number,
  totalEffectifsValides: number,
  totalTauxAugmentationFemmes: number,
  totalTauxAugmentationHommes: number,
): boolean =>
  presenceAugmentation &&
  effectifEstCalculable(totalNombreSalaries, totalEffectifsValides) &&
  (totalTauxAugmentationFemmes > 0 || totalTauxAugmentationHommes > 0)

// IEA
export const ecartAugmentation = (indicateurCalculable: boolean, totalEcartPondere?: number): number | undefined =>
  indicateurCalculable && totalEcartPondere !== undefined ? roundDecimal(100 * totalEcartPondere, 6) : undefined

export const ecartAugmentationAbsolu = (indicateurEcartAugmentation?: number): number | undefined =>
  indicateurEcartAugmentation !== undefined ? Math.abs(indicateurEcartAugmentation) : undefined

export const sexeSurRepresente = (indicateurEcartAugmentation?: number): SexeType | undefined => {
  if (indicateurEcartAugmentation === undefined || indicateurEcartAugmentation === 0) {
    return undefined
  }
  return Math.sign(indicateurEcartAugmentation) < 0 ? "femmes" : "hommes"
}

// NOTE
export const calculerNote = (
  indicateurEcartAugmentation?: number,
  noteIndicateurUn?: number,
  indicateurUnSexeSurRepresente?: SexeType,
  indicateurDeuxSexeSurRepresente?: SexeType,
): { note: number | undefined; mesureCorrection: boolean } => {
  if (
    noteIndicateurUn !== undefined &&
    noteIndicateurUn < 40 &&
    indicateurUnSexeSurRepresente &&
    indicateurDeuxSexeSurRepresente &&
    indicateurUnSexeSurRepresente !== indicateurDeuxSexeSurRepresente
  ) {
    return { note: baremeEcartAugmentation[0], mesureCorrection: true }
  }
  const note =
    indicateurEcartAugmentation !== undefined
      ? baremeEcartAugmentation[
          Math.min(
            baremeEcartAugmentation.length - 1,
            Math.ceil(Math.max(0, roundDecimal(indicateurEcartAugmentation, 1))),
          )
        ]
      : undefined
  return { note, mesureCorrection: false }
}

/////////
// ALL //
/////////

export default function calculerIndicateurDeux(state: AppState) {
  const effectifEtEcartAugmentParGroupe = calculerEffectifsEtEcartAugmentationParCSP(
    state.effectif.nombreSalaries,
    state.indicateurDeux.tauxAugmentation,
  )

  const { totalNombreSalaries, totalEffectifsValides, totalTauxAugmentationFemmes, totalTauxAugmentationHommes } =
    calculerTotalEffectifsEtTauxAugmentation(effectifEtEcartAugmentParGroupe)

  const ecartsPonderesByRow = calculerEcartsPonderesParCSP(effectifEtEcartAugmentParGroupe, totalEffectifsValides)

  // TEP
  const totalEcartPondere = calculerTotalEcartPondere(ecartsPonderesByRow)

  // IC
  const effectifsIndicateurCalculable = effectifEstCalculable(totalNombreSalaries, totalEffectifsValides)

  // IC
  const indicateurCalculable = estCalculable(
    state.indicateurDeux.presenceAugmentation,
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes,
  )

  // IEA
  const indicateurEcartAugmentation = ecartAugmentation(indicateurCalculable, totalEcartPondere)

  const indicateurEcartAugmentationAbsolute = ecartAugmentationAbsolu(indicateurEcartAugmentation)

  const indicateurDeuxSexeSurRepresente = sexeSurRepresente(indicateurEcartAugmentation)

  // Mesures correction indicateur 1
  const { indicateurSexeSurRepresente: indicateurUnSexeSurRepresente, noteIndicateurUn } = calculerIndicateurUn(state)

  // NOTE
  const { note: noteIndicateurDeux, mesureCorrection: correctionMeasure } = calculerNote(
    indicateurEcartAugmentationAbsolute,
    noteIndicateurUn,
    indicateurUnSexeSurRepresente,
    indicateurDeuxSexeSurRepresente,
  )

  return {
    effectifsIndicateurCalculable,
    effectifEtEcartAugmentParGroupe,
    indicateurCalculable,
    indicateurEcartAugmentation: indicateurEcartAugmentationAbsolute,
    indicateurSexeSurRepresente: indicateurDeuxSexeSurRepresente,
    noteIndicateurDeux,
    correctionMeasure,
  }
}
