import { AppState } from "../globals.d";

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
  ecartNombreSalaries: number | undefined
): number | undefined => {
  if (ecartTaux === undefined || ecartNombreSalaries === undefined) {
    return undefined;
  }
  const noteEcartTaux = calculBarem(ecartTaux);
  const noteEcartNombreSalaries = calculBarem(ecartNombreSalaries);

  return Math.max(noteEcartTaux, noteEcartNombreSalaries);
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

  // // NOTE
  const noteIndicateurDeuxTrois = calculNote(
    indicateurEcartAugmentationPromotionAbsolute,
    indicateurEcartNombreEquivalentSalaries
  );

  return {
    indicateurCalculable,
    indicateurEcartAugmentationPromotion: indicateurEcartAugmentationPromotionAbsolute,
    indicateurEcartNombreEquivalentSalaries,
    indicateurSexeSurRepresente,
    noteIndicateurDeuxTrois
  };
}
