import { AppState, SexeType } from "../globals"

import calculerIndicateurUn from "./calculsEgaProIndicateurUn"
import totalNombreSalaries from "./totalNombreSalaries"

import {
  calculerEcartTauxAugmentation,
  ecartAugmentation,
  ecartAugmentationAbsolu,
  sexeSurRepresente,
} from "../utils/calculsEgaProIndicateurDeux"
import { roundDecimal } from "./number"

/*
 * Indicateur 2Et3: écart de taux d’augmentation (50 à 250 salariés)
 */

const baremeAugmentationPromotion = [35, 35, 35, 25, 25, 25, 15, 15, 15, 15, 15, 0]

// ETP
export const calculerEcartTauxAugmentationPromotion = calculerEcartTauxAugmentation

// IEP
export const calculerEcartAugmentationPromotion = ecartAugmentation

export const calculerEcartAugmentationPromotionAbsolu = ecartAugmentationAbsolu

// IC
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

// NOTE

export const calculerBareme = (indicateur: number): number => {
  return baremeAugmentationPromotion[
    Math.min(baremeAugmentationPromotion.length - 1, Math.ceil(Math.max(0, roundDecimal(indicateur, 1))))
  ]
}

type CalculerNoteResult = {
  note: number | undefined
  correctionMeasure: boolean
  noteEcartTaux: number | undefined
  noteEcartNombreSalaries: number | undefined
}

export const calculerNote = (
  ecartTaux: number | undefined, // pourcentage
  ecartNombreEquivalentSalaries: number | undefined,
  noteIndicateurUn: number | undefined,
  indicateurUnSexeSurRepresente?: SexeType,
  indicateurDeuxTroisSexeSurRepresente?: SexeType,
): CalculerNoteResult => {
  const noteEcartTaux = ecartTaux !== undefined ? calculerBareme(ecartTaux) : undefined
  const noteEcartNombreSalaries =
    ecartNombreEquivalentSalaries !== undefined ? calculerBareme(ecartNombreEquivalentSalaries) : undefined

  if (
    noteIndicateurUn !== undefined &&
    noteIndicateurUn < 40 &&
    indicateurUnSexeSurRepresente &&
    indicateurDeuxTroisSexeSurRepresente &&
    indicateurUnSexeSurRepresente !== indicateurDeuxTroisSexeSurRepresente
  ) {
    // Si l’écart de taux d'augmentation joue en faveur du sexe le moins bien rémunéré (indicateur 1), on considère qu'un rattrapage est en cours.
    // La note maximale sera attribuée à l’entreprise pour cet indicateur.
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

  return {
    // On prend la note qui favorise l'entreprise.
    note: Math.max(noteEcartTaux, noteEcartNombreSalaries),
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

  // Vérification du nombre minimum de salariés pour cet indicateur.
  const effectifsIndicateurCalculable = calculerEffectifsIndicateurCalculable(
    totalNombreSalariesHommes,
    totalNombreSalariesFemmes,
  )

  // L'indicateure n'est pas calculable si l'entreprise n'a pas eu d'augmentation (et il faut aussi qu'il y ait le nombre minimum de salariés, bizarrerie de cet indicateur).
  const indicateurCalculable = estCalculable(
    state.indicateurDeuxTrois.presenceAugmentationPromotion,
    effectifsIndicateurCalculable,
  )

  // Calcul du ratio entre nombre d'augmentation hommes / nombre de salariés hommes. Nombre entre 0 et 1.
  const tauxAugmentationPromotionHommes = calculerTaux(
    state.indicateurDeuxTrois.nombreAugmentationPromotionHommes,
    totalNombreSalariesHommes,
  )

  // Calcul du ratio entre nombre d'augmentation femmes / nombre de salariés femmes. Nombre entre 0 et 1.
  const tauxAugmentationPromotionFemmes = calculerTaux(
    state.indicateurDeuxTrois.nombreAugmentationPromotionFemmes,
    totalNombreSalariesFemmes,
  )

  // IEA
  // Différence entre les taux d'augmentation hommes et femmes, arrondie à la 6ème décimale.
  const ecartTauxAugmentationPromotion = calculerEcartTauxAugmentationPromotion(
    tauxAugmentationPromotionFemmes,
    tauxAugmentationPromotionHommes,
  )

  // Écart en pourcentage. Undefined si l'indicateur n'est pas calculable.
  const indicateurEcartAugmentationPromotion = calculerEcartAugmentationPromotion(
    indicateurCalculable,
    ecartTauxAugmentationPromotion,
  )

  // Pourcentage en valeur absolue de l'écart précédent. Undefined si l'indicateur n'est pas calculable.
  const indicateurEcartAugmentationPromotionAbsolu = calculerEcartAugmentationPromotionAbsolu(
    indicateurEcartAugmentationPromotion,
  )

  // "hommes" ou "femmes" selon le sexe le moins bien représenté. Undefined si l'indicateur n'est pas calculable.
  const indicateurSexeSurRepresente = sexeSurRepresente(indicateurEcartAugmentationPromotion)

  // Écart en nombre équivalent de salariés, en prenant le minimum des salariés entre les hommes et les femmes.
  const indicateurEcartNombreEquivalentSalaries = calculerEcartNbEquivalentSalaries(
    indicateurEcartAugmentationPromotionAbsolu,
    totalNombreSalariesHommes,
    totalNombreSalariesFemmes,
  )

  // Récupération de données de l'indicateur 1 pour vérifier ensuite si une opération de rattrappage est en cours.
  const { indicateurSexeSurRepresente: indicateurUnSexeSurRepresente, noteIndicateurUn } = calculerIndicateurUn(state)

  // Calcul de la note et ses informations.
  const {
    note: noteIndicateurDeuxTrois,
    correctionMeasure, // Précise que la note est maximale car une opération de rattrappage est en cours par l'entreprise.
    noteEcartTaux, // Note en prenant en compte l'écart en pourcentage.
    noteEcartNombreSalaries, // Note en prenant en compte l'écart en nombre équivalent de salariés.
  } = calculerNote(
    indicateurEcartAugmentationPromotionAbsolu,
    indicateurEcartNombreEquivalentSalaries,
    noteIndicateurUn,
    indicateurUnSexeSurRepresente,
    indicateurSexeSurRepresente,
  )

  return {
    effectifsIndicateurCalculable, // Vrai si l'indicateur est calculable via le nombre de salariés.
    indicateurCalculable, // Vrai si l'indicateur est calculable via le nombre de salariés et la présence d'augmentation.
    indicateurEcartAugmentationPromotion: indicateurEcartAugmentationPromotionAbsolu, // Écart en pourcentage, nombre positif.
    indicateurEcartNombreEquivalentSalaries, // Écart en nombre équivalent de salariés.
    indicateurSexeSurRepresente, // "hommes" ou "femmes" (ou undefined) selon le sexe le moins bien représenté.
    noteEcartTaux, // Note en prenant en compte l'écart en pourcentage.
    noteEcartNombreSalaries, // Note en prenant en compte l'écart en nombre équivalent de salariés.
    noteIndicateurDeuxTrois, // Note réelle de l'indicateur.
    correctionMeasure, // Vrai si la note est maximale car une opération de rattrappage est en cours par l'entreprise.
    tauxAugmentationPromotionHommes, // Ratio entre nombre d'augmentation hommes / nombre de salariés hommes. Nombre entre 0 et 1.
    tauxAugmentationPromotionFemmes, // Ratio entre nombre d'augmentation femmes / nombre de salariés femmes. Nombre entre 0 et 1.
  }
}
