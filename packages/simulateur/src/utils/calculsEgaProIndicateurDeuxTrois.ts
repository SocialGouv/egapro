import { AppState, SexeType } from "../globals"

import calculerIndicateurUn from "./calculsEgaProIndicateurUn"
import totalNombreSalaries from "./totalNombreSalaries"

import {
  calculerEcartTauxAugmentation,
  ecartAugmentation,
  sexeSurRepresente,
  ecartAugmentationAbsolu,
} from "../utils/calculsEgaProIndicateurDeux"
import { roundDecimal } from "./number"

const baremeAugmentationPromotion = [35, 35, 35, 25, 25, 25, 15, 15, 15, 15, 15, 0]

///////////////////////
// INDICATEUR 2 ET 3 //
///////////////////////

// // ETP
export const calculerEcartTauxAugmentationPromotion = calculerEcartTauxAugmentation

// // IEP
export const calculerEcartAugmentationPromotion = ecartAugmentation

export const calculerEcartAugmentationPromotionAbsolu = ecartAugmentationAbsolu

// // IC
export const calculerEffectifsIndicateurCalculable = (
  totalNombreSalariesHommes: number | undefined,
  totalNombreSalariesFemmes: number | undefined,
): boolean => {
  return (
    totalNombreSalariesHommes !== undefined &&
    totalNombreSalariesFemmes !== undefined &&
    totalNombreSalariesHommes >= 5 &&
    totalNombreSalariesFemmes >= 5
  )
}

export const estCalculable = (
  presenceAugmentationPromotion: boolean,
  effectifsIndicateurCalculable: boolean,
): boolean => {
  return presenceAugmentationPromotion && effectifsIndicateurCalculable
}

export const calculerTaux = (nombreSalaries?: number, totalNombreSalaries?: number): number | undefined =>
  nombreSalaries !== undefined && totalNombreSalaries !== undefined && totalNombreSalaries > 0
    ? nombreSalaries / totalNombreSalaries
    : undefined

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

export const calculerEcartNbEquivalentSalaries = (
  indicateurEcartAugmentationPromotionAbsolute: number | undefined,
  totalNombreSalariesHommes: number | undefined,
  totalNombreSalariesFemmes: number | undefined,
): number | undefined => {
  return indicateurEcartAugmentationPromotionAbsolute !== undefined &&
    totalNombreSalariesHommes !== undefined &&
    totalNombreSalariesFemmes !== undefined
    ? roundDecimal(
        (indicateurEcartAugmentationPromotionAbsolute *
          Math.min(totalNombreSalariesHommes, totalNombreSalariesFemmes)) /
          100,
        1,
      )
    : undefined
}

// // NOTE

export const calculerBareme = (indicateur: number): number => {
  return baremeAugmentationPromotion[
    Math.min(baremeAugmentationPromotion.length - 1, Math.ceil(Math.max(0, roundDecimal(indicateur, 1))))
  ]
}

export const calculerNote = (
  ecartTaux: number | undefined,
  ecartNombreSalaries: number | undefined,
  noteIndicateurUn: number | undefined,
  indicateurUnSexeSurRepresente?: SexeType,
  indicateurDeuxTroisSexeSurRepresente?: SexeType,
): {
  note: number | undefined
  correctionMeasure: boolean
  noteEcartTaux: number | undefined
  noteEcartNombreSalaries: number | undefined
} => {
  const noteEcartTaux = ecartTaux !== undefined ? calculerBareme(ecartTaux) : undefined
  const noteEcartNombreSalaries = ecartNombreSalaries !== undefined ? calculerBareme(ecartNombreSalaries) : undefined
  if (
    noteIndicateurUn !== undefined &&
    noteIndicateurUn < 40 &&
    indicateurUnSexeSurRepresente &&
    indicateurDeuxTroisSexeSurRepresente &&
    indicateurUnSexeSurRepresente !== indicateurDeuxTroisSexeSurRepresente
  ) {
    return {
      note: baremeAugmentationPromotion[0],
      correctionMeasure: true,
      noteEcartTaux,
      noteEcartNombreSalaries,
    }
  }
  if (noteEcartTaux === undefined || noteEcartNombreSalaries === undefined) {
    return {
      note: undefined,
      correctionMeasure: false,
      noteEcartTaux,
      noteEcartNombreSalaries,
    }
  }

  const note = Math.max(noteEcartTaux, noteEcartNombreSalaries)
  return {
    note,
    correctionMeasure: false,
    noteEcartTaux,
    noteEcartNombreSalaries,
  }
}

/////////
// ALL //
/////////

export default function calculerIndicateurDeuxTrois(state: AppState) {
  const { totalNombreSalariesHomme: totalNombreSalariesHommes, totalNombreSalariesFemme: totalNombreSalariesFemmes } =
    totalNombreSalaries(state.effectif.nombreSalaries)

  const plusPetitNombreSalaries = calculerPlusPetitNbSalaries(totalNombreSalariesHommes, totalNombreSalariesFemmes)

  const effectifsIndicateurCalculable = calculerEffectifsIndicateurCalculable(
    totalNombreSalariesHommes,
    totalNombreSalariesFemmes,
  )

  const indicateurCalculable = estCalculable(
    state.indicateurDeuxTrois.presenceAugmentationPromotion,
    effectifsIndicateurCalculable,
  )

  const tauxAugmentationPromotionHommes = calculerTaux(
    state.indicateurDeuxTrois.nombreAugmentationPromotionHommes,
    totalNombreSalariesHommes,
  )
  const tauxAugmentationPromotionFemmes = calculerTaux(
    state.indicateurDeuxTrois.nombreAugmentationPromotionFemmes,
    totalNombreSalariesFemmes,
  )

  // // IEA
  const ecartTauxAugmentationPromotion = calculerEcartTauxAugmentationPromotion(
    tauxAugmentationPromotionFemmes,
    tauxAugmentationPromotionHommes,
  )

  const indicateurEcartAugmentationPromotion = calculerEcartAugmentationPromotion(
    indicateurCalculable,
    ecartTauxAugmentationPromotion,
  )

  const indicateurEcartAugmentationPromotionAbsolu = calculerEcartAugmentationPromotionAbsolu(
    indicateurEcartAugmentationPromotion,
  )

  const indicateurSexeSurRepresente = sexeSurRepresente(indicateurEcartAugmentationPromotion)

  // // Ecart en nombre équivalent de salariés
  const indicateurEcartNombreEquivalentSalaries = calculerEcartNbEquivalentSalaries(
    indicateurEcartAugmentationPromotionAbsolu,
    totalNombreSalariesHommes,
    totalNombreSalariesFemmes,
  )

  // Mesures correction indicateur 1
  const { indicateurSexeSurRepresente: indicateurUnSexeSurRepresente, noteIndicateurUn } = calculerIndicateurUn(state)

  // // NOTE
  const {
    note: noteIndicateurDeuxTrois,
    correctionMeasure,
    noteEcartTaux,
    noteEcartNombreSalaries,
  } = calculerNote(
    indicateurEcartAugmentationPromotionAbsolu,
    indicateurEcartNombreEquivalentSalaries,
    noteIndicateurUn,
    indicateurUnSexeSurRepresente,
    indicateurSexeSurRepresente,
  )

  return {
    effectifsIndicateurCalculable,
    indicateurCalculable,
    indicateurEcartAugmentationPromotion: indicateurEcartAugmentationPromotionAbsolu,
    indicateurEcartNombreEquivalentSalaries,
    indicateurSexeSurRepresente,
    noteEcartTaux,
    noteEcartNombreSalaries,
    noteIndicateurDeuxTrois,
    correctionMeasure,
    tauxAugmentationPromotionHommes,
    tauxAugmentationPromotionFemmes,
    plusPetitNombreSalaries,
  }
}
