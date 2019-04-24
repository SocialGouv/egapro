import {
  TranchesAges,
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionType,
  ActionEffectifData
} from "../globals.d";

import { roundDecimal } from "./helpers";

import {
  tauxEffectifValide,
  calculEcartsPonderesParGroupe,
  calculTotalEcartPondere,
  calculTotalEffectifs,
  rowEffectifsParCategorieSocioPro,
  effectifGroup
} from "./calculsEgaPro";

import {
  calculValiditeGroupe,
  calculEcartTauxAugmentation,
  calculEffectifsEtEcartAugmentParCategorieSocioPro,
  calculTotalEffectifsEtTauxAugmentation,
  //calculEcartsPonderesParCategorieSocioPro,
  //calculTotalEcartPondere,
  calculIndicateurCalculable,
  calculIndicateurEcartAugmentation
} from "../utils/calculsEgaProIndicateurDeux";

const baremEcartPromotion = [15, 15, 15, 10, 10, 10, 5, 5, 5, 5, 5, 0];

//////////////////
// COMMON ////////
//////////////////

export {
  calculValiditeGroupe, // VG
  calculTotalEcartPondere, // TEV
  calculIndicateurCalculable // IC
};

//////////////////
// INDICATEUR 2 //
//////////////////

// ETA
export const calculEcartTauxPromotion = calculEcartTauxAugmentation;

interface effectifEtEcartPromoGroup extends effectifGroup {
  categorieSocioPro: CategorieSocioPro;
  tauxPromotionFemmes: number;
  tauxPromotionHommes: number;
  ecartTauxPromotion: number | undefined;
}

export const calculEffectifsEtEcartPromoParCategorieSocioPro = (
  state: Array<Groupe>
): Array<effectifEtEcartPromoGroup> => {
  return state.map(
    ({
      categorieSocioPro,
      tranchesAges,
      tauxPromotionFemmes,
      tauxPromotionHommes
    }: Groupe) => {
      tauxPromotionFemmes = tauxPromotionFemmes || 0;
      tauxPromotionHommes = tauxPromotionHommes || 0;

      const effectifs = rowEffectifsParCategorieSocioPro(
        tranchesAges,
        calculValiditeGroupe
      );

      // ETA
      const ecartTauxPromotion = calculEcartTauxPromotion(
        tauxPromotionFemmes,
        tauxPromotionHommes
      );

      return {
        ...effectifs,
        categorieSocioPro,
        tauxPromotionFemmes,
        tauxPromotionHommes,
        ecartTauxPromotion
      };
    }
  );
};

export const calculTotalEffectifsEtTauxPromotion = (
  groupEffectifEtEcartAugment: Array<effectifEtEcartPromoGroup>
) => {
  const {
    totalNombreSalariesFemmes,
    totalNombreSalariesHommes,
    totalNombreSalaries,
    totalEffectifsValides
  } = calculTotalEffectifs(groupEffectifEtEcartAugment);

  const {
    sommeProduitTauxPromotionFemmes,
    sommeProduitTauxPromotionHommes
  } = groupEffectifEtEcartAugment.reduce(
    (
      { sommeProduitTauxPromotionFemmes, sommeProduitTauxPromotionHommes },
      {
        nombreSalariesFemmes,
        nombreSalariesHommes,
        tauxPromotionFemmes,
        tauxPromotionHommes
      }
    ) => {
      return {
        sommeProduitTauxPromotionFemmes:
          sommeProduitTauxPromotionFemmes +
          (tauxPromotionFemmes || 0) * nombreSalariesFemmes,
        sommeProduitTauxPromotionHommes:
          sommeProduitTauxPromotionHommes +
          (tauxPromotionHommes || 0) * nombreSalariesHommes
      };
    },
    {
      sommeProduitTauxPromotionFemmes: 0,
      sommeProduitTauxPromotionHommes: 0
    }
  );

  // TTAF
  const totalTauxPromotionFemmes =
    sommeProduitTauxPromotionFemmes / totalNombreSalariesFemmes;

  // TTAH
  const totalTauxPromotionHommes =
    sommeProduitTauxPromotionHommes / totalNombreSalariesHommes;

  return {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxPromotionFemmes,
    totalTauxPromotionHommes
  };
};

export const calculEcartsPonderesParCategorieSocioPro = calculEcartsPonderesParGroupe(
  ({ ecartTauxPromotion }) => ecartTauxPromotion
);

// IEA
export const calculIndicateurEcartPromotion = calculIndicateurEcartAugmentation;

// NOTE
export const calculNote = (
  indicateurEcartPromotion: number | undefined
): number | undefined =>
  indicateurEcartPromotion !== undefined
    ? baremEcartPromotion[
        Math.min(
          baremEcartPromotion.length - 1,
          Math.ceil(Math.max(0, indicateurEcartPromotion))
        )
      ]
    : undefined;
