import {
  AppState,
  CategorieSocioPro,
  GroupeEffectif,
  GroupeIndicateurDeuxTrois
} from "../globals.d";

import { roundDecimal } from "./helpers";

import {
  calculEcartsPonderesParGroupe,
  calculTotalEcartPondere,
  calculTotalEffectifs,
  calculEffectifsIndicateurCalculable,
  rowEffectifsParCategorieSocioPro,
  effectifGroup
} from "./calculsEgaPro";

import {
  calculValiditeGroupe,
  calculEcartTauxAugmentation,
  calculIndicateurCalculable,
  calculIndicateurEcartAugmentation,
  // calculIndicateurSexeSurRepresente,
  calculIndicateurEcartAugmentationAbsolute
} from "../utils/calculsEgaProIndicateurDeux";
// import calculIndicateurUn from "./calculsEgaProIndicateurUn";

const baremEcartAugmentationPromotion = [
  15,
  15,
  15,
  10,
  10,
  10,
  5,
  5,
  5,
  5,
  5,
  0
];

//////////////////
// COMMON ////////
//////////////////

export {
  calculValiditeGroupe, // VG
  calculTotalEcartPondere, // TEV
  calculEffectifsIndicateurCalculable, // IC
  calculIndicateurCalculable // IC
};

//////////////////
// INDICATEUR 3 //
//////////////////

// ETP
export const calculEcartTauxAugmentationPromotion = calculEcartTauxAugmentation;

export interface effectifEtEcartAugmentationPromotionGroup
  extends effectifGroup {
  categorieSocioPro: CategorieSocioPro;
  tauxAugmentationPromotionFemmes: number | undefined;
  tauxAugmentationPromotionHommes: number | undefined;
  ecartTauxAugmentationPromotion: number | undefined;
}

export const calculEffectifsEtEcartAugmentationPromotionParCategorieSocioPro = (
  dataEffectif: Array<GroupeEffectif>,
  dataIndicateurDeuxTrois: Array<GroupeIndicateurDeuxTrois>
): Array<effectifEtEcartAugmentationPromotionGroup> => {
  return dataEffectif.map(
    ({ categorieSocioPro, tranchesAges }: GroupeEffectif) => {
      const effectifs = rowEffectifsParCategorieSocioPro(
        tranchesAges,
        calculValiditeGroupe
      );

      const dataPromo = dataIndicateurDeuxTrois.find(
        ({ categorieSocioPro: csp }) => csp === categorieSocioPro
      );

      const tauxAugmentationPromotionFemmes =
        dataPromo && dataPromo.tauxAugmentationPromotionFemmes;
      const tauxAugmentationPromotionHommes =
        dataPromo && dataPromo.tauxAugmentationPromotionHommes;

      // ETA
      const ecartTauxAugmentationPromotion = calculEcartTauxAugmentationPromotion(
        tauxAugmentationPromotionFemmes,
        tauxAugmentationPromotionHommes
      );

      return {
        ...effectifs,
        categorieSocioPro,
        tauxAugmentationPromotionFemmes,
        tauxAugmentationPromotionHommes,
        ecartTauxAugmentationPromotion
      };
    }
  );
};

export const calculTotalEffectifsEtTauxAugmentationPromotion = (
  groupEffectifEtEcartAugment: Array<effectifEtEcartAugmentationPromotionGroup>
) => {
  const {
    totalNombreSalariesFemmes,
    totalNombreSalariesHommes,
    totalNombreSalaries,
    totalEffectifsValides
  } = calculTotalEffectifs(groupEffectifEtEcartAugment);

  const {
    sommeProduitTauxAugmentationPromotionFemmes,
    sommeProduitTauxAugmentationPromotionHommes
  } = groupEffectifEtEcartAugment.reduce(
    (
      {
        sommeProduitTauxAugmentationPromotionFemmes,
        sommeProduitTauxAugmentationPromotionHommes
      },
      {
        nombreSalariesFemmes,
        nombreSalariesHommes,
        tauxAugmentationPromotionFemmes,
        tauxAugmentationPromotionHommes
      }
    ) => {
      return {
        sommeProduitTauxAugmentationPromotionFemmes:
          sommeProduitTauxAugmentationPromotionFemmes +
          (tauxAugmentationPromotionFemmes || 0) * nombreSalariesFemmes,
        sommeProduitTauxAugmentationPromotionHommes:
          sommeProduitTauxAugmentationPromotionHommes +
          (tauxAugmentationPromotionHommes || 0) * nombreSalariesHommes
      };
    },
    {
      sommeProduitTauxAugmentationPromotionFemmes: 0,
      sommeProduitTauxAugmentationPromotionHommes: 0
    }
  );

  // TTPF
  const totalTauxAugmentationPromotionFemmes =
    sommeProduitTauxAugmentationPromotionFemmes / totalNombreSalariesFemmes;

  // TTPH
  const totalTauxAugmentationPromotionHommes =
    sommeProduitTauxAugmentationPromotionHommes / totalNombreSalariesHommes;

  return {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationPromotionFemmes,
    totalTauxAugmentationPromotionHommes
  };
};

export const calculEcartsPonderesParCategorieSocioPro = calculEcartsPonderesParGroupe(
  ({ ecartTauxAugmentationPromotion }) => ecartTauxAugmentationPromotion
);

// IEP
export const calculIndicateurEcartAugmentationPromotion = calculIndicateurEcartAugmentation;

export const calculIndicateurEcartAugmentationPromotionAbsolute = calculIndicateurEcartAugmentationAbsolute;

// NOTE
export const calculNote = (
  indicateurEcartAugmentationPromotion: number | undefined,
  noteIndicateurUn: number | undefined,
  indicateurUnSexeSurRepresente: "hommes" | "femmes" | undefined,
  indicateurDeuxSexeSurRepresente: "hommes" | "femmes" | undefined
): { note: number | undefined; correctionMeasure: boolean } => {
  if (
    noteIndicateurUn !== undefined &&
    noteIndicateurUn < 40 &&
    indicateurUnSexeSurRepresente &&
    indicateurDeuxSexeSurRepresente &&
    indicateurUnSexeSurRepresente !== indicateurDeuxSexeSurRepresente
  ) {
    return {
      note: baremEcartAugmentationPromotion[0],
      correctionMeasure: true
    };
  }
  const note =
    indicateurEcartAugmentationPromotion !== undefined
      ? baremEcartAugmentationPromotion[
          Math.min(
            baremEcartAugmentationPromotion.length - 1,
            Math.ceil(
              Math.max(0, roundDecimal(indicateurEcartAugmentationPromotion, 1))
            )
          )
        ]
      : undefined;
  return { note, correctionMeasure: false };
};

/////////
// ALL //
/////////

// TODO: complete the computation
// export default function calculIndicateurDeuxTrois(state: AppState) {
//   const effectifEtEcartAugmentationPromotionParGroupe = calculEffectifsEtEcartAugmentationPromotionParCategorieSocioPro(
//     state.effectif.nombreSalaries,
//     state.indicateurDeuxTrois.tauxAugmentationPromotion
//   );

//   const {
//     totalNombreSalaries,
//     totalEffectifsValides,
//     totalTauxAugmentationPromotionFemmes,
//     totalTauxAugmentationPromotionHommes
//   } = calculTotalEffectifsEtTauxAugmentationPromotion(
//     effectifEtEcartAugmentationPromotionParGroupe
//   );

//   const ecartsPonderesByRow = calculEcartsPonderesParCategorieSocioPro(
//     effectifEtEcartAugmentationPromotionParGroupe,
//     totalEffectifsValides
//   );

//   // TEP
//   const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow);

//   // IC
//   const effectifsIndicateurCalculable = calculEffectifsIndicateurCalculable(
//     totalNombreSalaries,
//     totalEffectifsValides
//   );

//   // IC
//   const indicateurCalculable = calculIndicateurCalculable(
//     state.indicateurDeuxTrois.presenceAugmentationPromotion,
//     totalNombreSalaries,
//     totalEffectifsValides,
//     totalTauxAugmentationPromotionFemmes,
//     totalTauxAugmentationPromotionHommes
//   );

//   // IEA
//   const indicateurEcartAugmentationPromotion = calculIndicateurEcartAugmentationPromotion(
//     indicateurCalculable,
//     totalEcartPondere
//   );

//   const indicateurEcartAugmentationPromotionAbsolute = calculIndicateurEcartAugmentationPromotionAbsolute(
//     indicateurEcartAugmentationPromotion
//   );

//   const indicateurDeuxTroisSexeSurRepresente = calculIndicateurSexeSurRepresente(
//     indicateurEcartAugmentationPromotion
//   );

//   // Mesures correction indicateur 1
//   const {
//     indicateurSexeSurRepresente: indicateurUnSexeSurRepresente,
//     noteIndicateurUn
//   } = calculIndicateurUn(state);

//   // NOTE
//   const { note: noteIndicateurDeuxTrois, correctionMeasure } = calculNote(
//     indicateurEcartAugmentationPromotionAbsolute,
//     noteIndicateurUn,
//     indicateurUnSexeSurRepresente,
//     indicateurDeuxTroisSexeSurRepresente
//   );

//   return {
//     effectifsIndicateurCalculable,
//     effectifEtEcartAugmentationPromotionParGroupe,
//     indicateurCalculable,
//     indicateurEcartAugmentationPromotion: indicateurEcartAugmentationPromotionAbsolute,
//     indicateurSexeSurRepresente: indicateurDeuxTroisSexeSurRepresente,
//     noteIndicateurDeuxTrois,
//     correctionMeasure
//   };
// }
export default function calculIndicateurDeuxTrois(state: AppState) {
  const indicateurSexeSurRepresente: "hommes" | "femmes" | undefined = "hommes";
  return {
    effectifsIndicateurCalculable: 10,
    effectifEtEcartAugmentationPromotionParGroupe: 0,
    indicateurCalculable: true,
    indicateurEcartAugmentationPromotion: 0,
    indicateurSexeSurRepresente: indicateurSexeSurRepresente,
    noteIndicateurDeuxTrois: 0,
    correctionMeasure: false
  };
}
