import {
  AppState,
  CategorieSocioPro,
  GroupeEffectif,
  GroupeIndicateurTrois
} from "../globals.d";

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
  calculIndicateurSexeSousRepresente,
  calculIndicateurEcartAugmentationAbsolute
} from "../utils/calculsEgaProIndicateurDeux";

const baremEcartPromotion = [15, 15, 15, 10, 10, 10, 5, 5, 5, 5, 5, 0];

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
export const calculEcartTauxPromotion = calculEcartTauxAugmentation;

export interface effectifEtEcartPromoGroup extends effectifGroup {
  categorieSocioPro: CategorieSocioPro;
  tauxPromotionFemmes: number | undefined;
  tauxPromotionHommes: number | undefined;
  ecartTauxPromotion: number | undefined;
}

export const calculEffectifsEtEcartPromoParCategorieSocioPro = (
  dataEffectif: Array<GroupeEffectif>,
  dataIndicateurTrois: Array<GroupeIndicateurTrois>
): Array<effectifEtEcartPromoGroup> => {
  return dataEffectif.map(
    ({ categorieSocioPro, tranchesAges }: GroupeEffectif) => {
      const effectifs = rowEffectifsParCategorieSocioPro(
        tranchesAges,
        calculValiditeGroupe
      );

      const dataPromo = dataIndicateurTrois.find(
        ({ categorieSocioPro: csp }) => csp === categorieSocioPro
      );

      const tauxPromotionFemmes = dataPromo && dataPromo.tauxPromotionFemmes;
      const tauxPromotionHommes = dataPromo && dataPromo.tauxPromotionHommes;

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

  // TTPF
  const totalTauxPromotionFemmes =
    sommeProduitTauxPromotionFemmes / totalNombreSalariesFemmes;

  // TTPH
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

// IEP
export const calculIndicateurEcartPromotion = calculIndicateurEcartAugmentation;

export const calculIndicateurEcartPromotionAbsolute = calculIndicateurEcartAugmentationAbsolute;

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

/////////
// ALL //
/////////

export default function calculIndicateurTrois(state: AppState) {
  const effectifEtEcartPromoParGroupe = calculEffectifsEtEcartPromoParCategorieSocioPro(
    state.effectif.nombreSalaries,
    state.indicateurTrois.tauxPromotion
  );

  const {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxPromotionFemmes,
    totalTauxPromotionHommes
  } = calculTotalEffectifsEtTauxPromotion(effectifEtEcartPromoParGroupe);

  const ecartsPonderesByRow = calculEcartsPonderesParCategorieSocioPro(
    effectifEtEcartPromoParGroupe,
    totalEffectifsValides
  );

  // TEP
  const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow);

  // IC
  const effectifsIndicateurCalculable = calculEffectifsIndicateurCalculable(
    totalNombreSalaries,
    totalEffectifsValides
  );

  // IC
  const indicateurCalculable = calculIndicateurCalculable(
    state.indicateurTrois.presencePromotion,
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxPromotionFemmes,
    totalTauxPromotionHommes
  );

  // IEA
  const indicateurEcartPromotion = calculIndicateurEcartPromotion(
    indicateurCalculable,
    totalEcartPondere
  );

  const indicateurEcartPromotionAbsolute = calculIndicateurEcartPromotionAbsolute(
    indicateurEcartPromotion
  );

  const indicateurSexeSurRepresente = calculIndicateurSexeSousRepresente(
    indicateurEcartPromotion
  );

  // NOTE
  const noteIndicateurTrois = calculNote(indicateurEcartPromotion);

  return {
    effectifsIndicateurCalculable,
    effectifEtEcartPromoParGroupe,
    indicateurCalculable,
    indicateurEcartPromotion: indicateurEcartPromotionAbsolute,
    indicateurSexeSurRepresente,
    noteIndicateurTrois
  };
}
