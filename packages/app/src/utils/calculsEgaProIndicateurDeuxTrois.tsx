import { AppState } from "../globals.d";

import calculIndicateurUn from "./calculsEgaProIndicateurUn";
import { roundDecimal } from "./helpers";
import totalNombreSalaries from "./totalNombreSalaries";

import {
  calculEcartTauxAugmentation,
  calculIndicateurEcartAugmentation,
  calculIndicateurSexeSurRepresente,
  calculIndicateurEcartAugmentationAbsolute
} from "../utils/calculsEgaProIndicateurDeux";

const barem = [35, 35, 35, 25, 25, 25, 15, 15, 15, 15, 15, 0];

///////////////////////
// INDICATEUR 2 ET 3 //
///////////////////////

// // ETP
export const calculEcartTauxAugmentationPromotion = calculEcartTauxAugmentation;

// // IEP
export const calculIndicateurEcartAugmentationPromotion = calculIndicateurEcartAugmentation;

export const calculIndicateurEcartAugmentationPromotionAbsolute = calculIndicateurEcartAugmentationAbsolute;

// // IC
export const calculIndicateurCalculable = (
  totalNombreSalariesHommes: number | undefined,
  totalNombreSalariesFemmes: number | undefined
): boolean => {
  return (
    totalNombreSalariesHommes !== undefined &&
    totalNombreSalariesFemmes !== undefined &&
    totalNombreSalariesHommes >= 5 &&
    totalNombreSalariesFemmes >= 5
  );
};

export const calculTaux = (
  nombreSalaries: number | undefined,
  totalNombreSalaries: number | undefined
): number | undefined =>
  nombreSalaries !== undefined &&
  totalNombreSalaries !== undefined &&
  totalNombreSalaries > 0
    ? nombreSalaries / totalNombreSalaries
    : undefined;

export const calculIndicateurEcartNombreEquivalentSalaries = (
  indicateurEcartAugmentationPromotionAbsolute: number | undefined,
  totalNombreSalariesHommes: number | undefined,
  totalNombreSalariesFemmes: number | undefined
): number | undefined => {
  return indicateurEcartAugmentationPromotionAbsolute !== undefined &&
    totalNombreSalariesHommes !== undefined &&
    totalNombreSalariesFemmes !== undefined
    ? roundDecimal(
        (indicateurEcartAugmentationPromotionAbsolute *
          Math.min(totalNombreSalariesHommes, totalNombreSalariesFemmes)) /
          100,
        1
      )
    : undefined;
};

// // NOTE

export const calculBarem = (indicateur: number): number => {
  return barem[
    Math.min(
      barem.length - 1,
      Math.ceil(Math.max(0, roundDecimal(indicateur, 1)))
    )
  ];
};

export const calculNote = (
  ecartTaux: number | undefined,
  ecartNombreSalaries: number | undefined,
  noteIndicateurUn: number | undefined,
  indicateurUnSexeSurRepresente: "hommes" | "femmes" | undefined,
  indicateurDeuxTroisSexeSurRepresente: "hommes" | "femmes" | undefined
): { note: number | undefined; correctionMeasure: boolean } => {
  if (
    noteIndicateurUn !== undefined &&
    noteIndicateurUn < 40 &&
    indicateurUnSexeSurRepresente &&
    indicateurDeuxTroisSexeSurRepresente &&
    indicateurUnSexeSurRepresente !== indicateurDeuxTroisSexeSurRepresente
  ) {
    return { note: barem[0], correctionMeasure: true };
  }
  if (ecartTaux === undefined || ecartNombreSalaries === undefined) {
    return { note: undefined, correctionMeasure: false };
  }
  const noteEcartTaux = calculBarem(ecartTaux);
  const noteEcartNombreSalaries = calculBarem(ecartNombreSalaries);

  const note = Math.max(noteEcartTaux, noteEcartNombreSalaries);
  return { note, correctionMeasure: false };
};

/////////
// ALL //
/////////

export default function calculIndicateurDeuxTrois(state: AppState) {
  const {
    totalNombreSalariesHomme: totalNombreSalariesHommes,
    totalNombreSalariesFemme: totalNombreSalariesFemmes
  } = totalNombreSalaries(state.effectif.nombreSalaries);

  const indicateurCalculable = calculIndicateurCalculable(
    totalNombreSalariesHommes,
    totalNombreSalariesFemmes
  );

  const tauxAugmentationPromotionHommes = calculTaux(
    state.indicateurDeuxTrois.nombreAugmentationPromotionHommes,
    totalNombreSalariesHommes
  );
  const tauxAugmentationPromotionFemmes = calculTaux(
    state.indicateurDeuxTrois.nombreAugmentationPromotionFemmes,
    totalNombreSalariesFemmes
  );

  // // IEA
  const ecartTauxAugmentationPromotion = calculEcartTauxAugmentationPromotion(
    tauxAugmentationPromotionFemmes,
    tauxAugmentationPromotionHommes
  );

  const indicateurEcartAugmentationPromotion = calculIndicateurEcartAugmentationPromotion(
    indicateurCalculable,
    ecartTauxAugmentationPromotion
  );

  const indicateurEcartAugmentationPromotionAbsolute = calculIndicateurEcartAugmentationPromotionAbsolute(
    indicateurEcartAugmentationPromotion
  );

  const indicateurSexeSurRepresente = calculIndicateurSexeSurRepresente(
    indicateurEcartAugmentationPromotion
  );

  // // Ecart en nombre équivalent de salariés
  const indicateurEcartNombreEquivalentSalaries = calculIndicateurEcartNombreEquivalentSalaries(
    indicateurEcartAugmentationPromotionAbsolute,
    totalNombreSalariesHommes,
    totalNombreSalariesFemmes
  );

  // Mesures correction indicateur 1
  const {
    indicateurSexeSurRepresente: indicateurUnSexeSurRepresente,
    noteIndicateurUn
  } = calculIndicateurUn(state);

  // // NOTE
  const { note: noteIndicateurDeuxTrois, correctionMeasure } = calculNote(
    indicateurEcartAugmentationPromotionAbsolute,
    indicateurEcartNombreEquivalentSalaries,
    noteIndicateurUn,
    indicateurUnSexeSurRepresente,
    indicateurSexeSurRepresente
  );

  return {
    indicateurCalculable,
    indicateurEcartAugmentationPromotion: indicateurEcartAugmentationPromotionAbsolute,
    indicateurEcartNombreEquivalentSalaries,
    indicateurSexeSurRepresente,
    noteIndicateurDeuxTrois,
    correctionMeasure
  };
}
