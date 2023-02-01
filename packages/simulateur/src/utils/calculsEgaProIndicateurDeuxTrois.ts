import { AppState } from "../globals"

import calculerIndicateurUn from "./calculsEgaProIndicateurUn"
import totalNombreSalaries from "./totalNombreSalaries"

import {
  calculEcartTauxAugmentation,
  calculIndicateurEcartAugmentation,
  calculIndicateurSexeSurRepresente,
  calculIndicateurEcartAugmentationAbsolute,
} from "../utils/calculsEgaProIndicateurDeux"
import { roundDecimal } from "./number"

const barem = [35, 35, 35, 25, 25, 25, 15, 15, 15, 15, 15, 0]

///////////////////////
// INDICATEUR 2 ET 3 //
///////////////////////

// // ETP
export const calculEcartTauxAugmentationPromotion = calculEcartTauxAugmentation

// // IEP
export const calculIndicateurEcartAugmentationPromotion = calculIndicateurEcartAugmentation

export const calculIndicateurEcartAugmentationPromotionAbsolute = calculIndicateurEcartAugmentationAbsolute

// // IC
export const calculEffectifsIndicateurCalculable = (
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

export const calculIndicateurCalculable = (
  presenceAugmentationPromotion: boolean,
  effectifsIndicateurCalculable: boolean,
): boolean => {
  return presenceAugmentationPromotion && effectifsIndicateurCalculable
}

export const calculTaux = (
  nombreSalaries: number | undefined,
  totalNombreSalaries: number | undefined,
): number | undefined =>
  nombreSalaries !== undefined && totalNombreSalaries !== undefined && totalNombreSalaries > 0
    ? nombreSalaries / totalNombreSalaries
    : undefined

export const calculPlusPetitNombreSalaries = (
  totalNombreSalariesHommes: number | undefined,
  totalNombreSalariesFemmes: number | undefined,
): "hommes" | "femmes" | undefined => {
  if (
    totalNombreSalariesFemmes === totalNombreSalariesHommes ||
    totalNombreSalariesFemmes === undefined ||
    totalNombreSalariesHommes === undefined
  ) {
    return undefined
  }
  return totalNombreSalariesHommes > totalNombreSalariesFemmes ? "femmes" : "hommes"
}

export const calculIndicateurEcartNombreEquivalentSalaries = (
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

export const calculBarem = (indicateur: number): number => {
  return barem[Math.min(barem.length - 1, Math.ceil(Math.max(0, roundDecimal(indicateur, 1))))]
}

export const calculNote = (
  ecartTaux: number | undefined,
  ecartNombreSalaries: number | undefined,
  noteIndicateurUn: number | undefined,
  indicateurUnSexeSurRepresente: "hommes" | "femmes" | undefined,
  indicateurDeuxTroisSexeSurRepresente: "hommes" | "femmes" | undefined,
): {
  note: number | undefined
  correctionMeasure: boolean
  noteEcartTaux: number | undefined
  noteEcartNombreSalaries: number | undefined
} => {
  const noteEcartTaux = ecartTaux !== undefined ? calculBarem(ecartTaux) : undefined
  const noteEcartNombreSalaries = ecartNombreSalaries !== undefined ? calculBarem(ecartNombreSalaries) : undefined
  if (
    noteIndicateurUn !== undefined &&
    noteIndicateurUn < 40 &&
    indicateurUnSexeSurRepresente &&
    indicateurDeuxTroisSexeSurRepresente &&
    indicateurUnSexeSurRepresente !== indicateurDeuxTroisSexeSurRepresente
  ) {
    return {
      note: barem[0],
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

  const plusPetitNombreSalaries = calculPlusPetitNombreSalaries(totalNombreSalariesHommes, totalNombreSalariesFemmes)

  const effectifsIndicateurCalculable = calculEffectifsIndicateurCalculable(
    totalNombreSalariesHommes,
    totalNombreSalariesFemmes,
  )

  const indicateurCalculable = calculIndicateurCalculable(
    state.indicateurDeuxTrois.presenceAugmentationPromotion,
    effectifsIndicateurCalculable,
  )

  const tauxAugmentationPromotionHommes = calculTaux(
    state.indicateurDeuxTrois.nombreAugmentationPromotionHommes,
    totalNombreSalariesHommes,
  )
  const tauxAugmentationPromotionFemmes = calculTaux(
    state.indicateurDeuxTrois.nombreAugmentationPromotionFemmes,
    totalNombreSalariesFemmes,
  )

  // // IEA
  const ecartTauxAugmentationPromotion = calculEcartTauxAugmentationPromotion(
    tauxAugmentationPromotionFemmes,
    tauxAugmentationPromotionHommes,
  )

  const indicateurEcartAugmentationPromotion = calculIndicateurEcartAugmentationPromotion(
    indicateurCalculable,
    ecartTauxAugmentationPromotion,
  )

  const indicateurEcartAugmentationPromotionAbsolute = calculIndicateurEcartAugmentationPromotionAbsolute(
    indicateurEcartAugmentationPromotion,
  )

  const indicateurSexeSurRepresente = calculIndicateurSexeSurRepresente(indicateurEcartAugmentationPromotion)

  // // Ecart en nombre équivalent de salariés
  const indicateurEcartNombreEquivalentSalaries = calculIndicateurEcartNombreEquivalentSalaries(
    indicateurEcartAugmentationPromotionAbsolute,
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
  } = calculNote(
    indicateurEcartAugmentationPromotionAbsolute,
    indicateurEcartNombreEquivalentSalaries,
    noteIndicateurUn,
    indicateurUnSexeSurRepresente,
    indicateurSexeSurRepresente,
  )

  return {
    effectifsIndicateurCalculable,
    indicateurCalculable,
    indicateurEcartAugmentationPromotion: indicateurEcartAugmentationPromotionAbsolute,
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
