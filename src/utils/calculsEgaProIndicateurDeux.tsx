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

const baremEcartAugmentation = [20, 20, 20, 10, 10, 10, 5, 5, 5, 5, 5, 0];

//////////////////
// COMMON ////////
//////////////////

export {
  calculTotalEcartPondere // TEV
};

//////////////////
// INDICATEUR 2 //
//////////////////

// VG
export const calculValiditeGroupe = (
  nombreSalariesFemmes: number,
  nombreSalariesHommes: number
): boolean => nombreSalariesFemmes >= 10 && nombreSalariesHommes >= 10;

// ETA
export const calculEcartTauxAugmentation = (
  tauxAugmentationFemmes: number,
  tauxAugmentationHommes: number
): number | undefined =>
  tauxAugmentationFemmes > 0 && tauxAugmentationHommes > 0
    ? roundDecimal(tauxAugmentationHommes - tauxAugmentationFemmes, 3)
    : undefined;

interface effectifEtEcartAugmentGroup extends effectifGroup {
  categorieSocioPro: CategorieSocioPro;
  tauxAugmentationFemmes: number;
  tauxAugmentationHommes: number;
  ecartTauxAugmentation: number | undefined;
}

export const calculEffectifsEtEcartAugmentParCategorieSocioPro = (
  state: Array<Groupe>
): Array<effectifEtEcartAugmentGroup> => {
  return state.map(
    ({
      categorieSocioPro,
      tranchesAges,
      tauxAugmentationFemmes,
      tauxAugmentationHommes
    }: Groupe) => {
      tauxAugmentationFemmes = tauxAugmentationFemmes || 0;
      tauxAugmentationHommes = tauxAugmentationHommes || 0;

      const effectifs = rowEffectifsParCategorieSocioPro(
        tranchesAges,
        calculValiditeGroupe
      );

      // ETA
      const ecartTauxAugmentation = calculEcartTauxAugmentation(
        tauxAugmentationFemmes,
        tauxAugmentationHommes
      );

      return {
        ...effectifs,
        categorieSocioPro,
        tauxAugmentationFemmes,
        tauxAugmentationHommes,
        ecartTauxAugmentation
      };
    }
  );
};

export const calculTotalEffectifsEtTauxAugmentation = (
  groupEffectifEtEcartAugment: Array<effectifEtEcartAugmentGroup>
) => {
  const {
    totalNombreSalariesFemmes,
    totalNombreSalariesHommes,
    totalNombreSalaries,
    totalEffectifsValides
  } = calculTotalEffectifs(groupEffectifEtEcartAugment);

  const {
    sommeProduitTauxAugmentationFemmes,
    sommeProduitTauxAugmentationHommes
  } = groupEffectifEtEcartAugment.reduce(
    (
      {
        sommeProduitTauxAugmentationFemmes,
        sommeProduitTauxAugmentationHommes
      },
      {
        nombreSalariesFemmes,
        nombreSalariesHommes,
        tauxAugmentationFemmes,
        tauxAugmentationHommes
      }
    ) => {
      return {
        sommeProduitTauxAugmentationFemmes:
          sommeProduitTauxAugmentationFemmes +
          (tauxAugmentationFemmes || 0) * nombreSalariesFemmes,
        sommeProduitTauxAugmentationHommes:
          sommeProduitTauxAugmentationHommes +
          (tauxAugmentationHommes || 0) * nombreSalariesHommes
      };
    },
    {
      sommeProduitTauxAugmentationFemmes: 0,
      sommeProduitTauxAugmentationHommes: 0
    }
  );

  // TTAF
  const totalTauxAugmentationFemmes =
    sommeProduitTauxAugmentationFemmes / totalNombreSalariesFemmes;

  // TTAH
  const totalTauxAugmentationHommes =
    sommeProduitTauxAugmentationHommes / totalNombreSalariesHommes;

  return {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes
  };
};

export const calculEcartsPonderesParCategorieSocioPro = calculEcartsPonderesParGroupe(
  ({ ecartTauxAugmentation }) => ecartTauxAugmentation
);

// IC
export const calculIndicateurCalculable = (
  totalNombreSalaries: number,
  totalEffectifsValides: number,
  totalTauxAugmentationFemmes: number,
  totalTauxAugmentationHommes: number
): boolean =>
  totalNombreSalaries > 0 &&
  totalEffectifsValides >= totalNombreSalaries * tauxEffectifValide &&
  (totalTauxAugmentationFemmes > 0 || totalTauxAugmentationHommes > 0);

// IEA
export const calculIndicateurEcartAugmentation = (
  indicateurCalculable: boolean,
  totalEcartPondere: number | undefined
): number | undefined =>
  indicateurCalculable && totalEcartPondere !== undefined
    ? roundDecimal(100 * totalEcartPondere, 3)
    : undefined;

// NOTE
export const calculNote = (
  indicateurEcartAugmentation: number | undefined
): number | undefined =>
  indicateurEcartAugmentation !== undefined
    ? baremEcartAugmentation[
        Math.min(
          baremEcartAugmentation.length - 1,
          Math.ceil(Math.max(0, indicateurEcartAugmentation))
        )
      ]
    : undefined;
