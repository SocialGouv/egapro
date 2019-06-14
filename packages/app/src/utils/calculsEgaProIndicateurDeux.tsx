import {
  AppState,
  CategorieSocioPro,
  Groupe,
  GroupeIndicateurDeux
} from "../globals.d";

import { roundDecimal } from "./helpers";

import {
  calculEcartsPonderesParGroupe,
  calculTotalEcartPondere,
  calculTotalEffectifs,
  rowEffectifsParCategorieSocioPro,
  effectifGroup,
  calculEffectifsIndicateurCalculable
} from "./calculsEgaPro";

const baremEcartAugmentation = [20, 20, 20, 10, 10, 10, 5, 5, 5, 5, 5, 0];

//////////////////
// COMMON ////////
//////////////////

export {
  calculTotalEcartPondere, // TEV
  calculEffectifsIndicateurCalculable // IC
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
  tauxAugmentationFemmes: number | undefined,
  tauxAugmentationHommes: number | undefined
): number | undefined =>
  tauxAugmentationFemmes !== undefined &&
  tauxAugmentationHommes !== undefined &&
  tauxAugmentationFemmes >= 0 &&
  tauxAugmentationHommes >= 0
    ? roundDecimal(tauxAugmentationHommes - tauxAugmentationFemmes, 3)
    : undefined;

export interface effectifEtEcartAugmentGroup extends effectifGroup {
  categorieSocioPro: CategorieSocioPro;
  tauxAugmentationFemmes: number | undefined;
  tauxAugmentationHommes: number | undefined;
  ecartTauxAugmentation: number | undefined;
}

export const calculEffectifsEtEcartAugmentParCategorieSocioPro = (
  dataEffectif: Array<Groupe>,
  dataIndicateurDeux: Array<GroupeIndicateurDeux>
): Array<effectifEtEcartAugmentGroup> => {
  return dataEffectif.map(({ categorieSocioPro, tranchesAges }: Groupe) => {
    const effectifs = rowEffectifsParCategorieSocioPro(
      tranchesAges,
      calculValiditeGroupe
    );

    const dataAugment = dataIndicateurDeux.find(
      ({ categorieSocioPro: csp }) => csp === categorieSocioPro
    );

    const tauxAugmentationFemmes =
      dataAugment && dataAugment.tauxAugmentationFemmes;
    const tauxAugmentationHommes =
      dataAugment && dataAugment.tauxAugmentationHommes;

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
  });
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
  presenceAugmentation: boolean,
  totalNombreSalaries: number,
  totalEffectifsValides: number,
  totalTauxAugmentationFemmes: number,
  totalTauxAugmentationHommes: number
): boolean =>
  presenceAugmentation &&
  calculEffectifsIndicateurCalculable(
    totalNombreSalaries,
    totalEffectifsValides
  ) &&
  (totalTauxAugmentationFemmes > 0 || totalTauxAugmentationHommes > 0);

// IEA
export const calculIndicateurEcartAugmentation = (
  indicateurCalculable: boolean,
  totalEcartPondere: number | undefined
): number | undefined =>
  indicateurCalculable && totalEcartPondere !== undefined
    ? roundDecimal(100 * totalEcartPondere, 3)
    : undefined;

export const calculIndicateurSexeSousRepresente = (
  indicateurEcartAugmentation: number | undefined
): "hommes" | "femmes" | undefined =>
  indicateurEcartAugmentation !== undefined
    ? Math.sign(indicateurEcartAugmentation) < 0
      ? "femmes"
      : "hommes"
    : undefined;

export const calculIndicateurEcartAugmentationAbsolute = (
  indicateurEcartAugmentation: number | undefined
): number | undefined =>
  indicateurEcartAugmentation !== undefined
    ? Math.abs(indicateurEcartAugmentation)
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

/////////
// ALL //
/////////

export default function calculIndicateurDeux(state: AppState) {
  const effectifEtEcartAugmentParGroupe = calculEffectifsEtEcartAugmentParCategorieSocioPro(
    state.data,
    state.indicateurDeux.tauxAugmentation
  );

  const {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes
  } = calculTotalEffectifsEtTauxAugmentation(effectifEtEcartAugmentParGroupe);

  const ecartsPonderesByRow = calculEcartsPonderesParCategorieSocioPro(
    effectifEtEcartAugmentParGroupe,
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
    state.indicateurDeux.presenceAugmentation,
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes
  );

  // IEA
  const indicateurEcartAugmentation = calculIndicateurEcartAugmentation(
    indicateurCalculable,
    totalEcartPondere
  );

  const indicateurEcartAugmentationAbsolute = calculIndicateurEcartAugmentationAbsolute(
    indicateurEcartAugmentation
  );

  const indicateurSexeSurRepresente = calculIndicateurSexeSousRepresente(
    indicateurEcartAugmentation
  );

  // NOTE
  const noteIndicateurDeux = calculNote(indicateurEcartAugmentation);

  return {
    effectifsIndicateurCalculable,
    effectifEtEcartAugmentParGroupe,
    indicateurCalculable,
    indicateurEcartAugmentation: indicateurEcartAugmentationAbsolute,
    indicateurSexeSurRepresente,
    noteIndicateurDeux
  };
}
