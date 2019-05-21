import {
  AppState,
  TranchesAges,
  Groupe,
  GroupTranchesAges
} from "../globals.d";

import { roundDecimal } from "./helpers";

import {
  calculEcartsPonderesParGroupe,
  calculTotalEcartPondere,
  calculTotalEffectifs,
  rowEffectifsParTrancheAge,
  effectifGroup,
  calculEffectifsIndicateurCalculable
} from "./calculsEgaPro";

/* INDICATEUR 1 CONST */

const seuilPertinence = 5 / 100;

const baremeEcartRemuneration = [
  40,
  39,
  38,
  37,
  36,
  35,
  34,
  33,
  31,
  29,
  27,
  25,
  23,
  21,
  19,
  17,
  14,
  11,
  8,
  5,
  2,
  0
];

//////////////////
// COMMON ////////
//////////////////

export {
  calculTotalEffectifs,
  calculTotalEcartPondere, // TEV
  calculEffectifsIndicateurCalculable // IC
};

//////////////////
// INDICATEUR 1 //
//////////////////

// VG
export const calculValiditeGroupe = (
  nombreSalariesFemmes: number,
  nombreSalariesHommes: number
): boolean => nombreSalariesFemmes >= 3 && nombreSalariesHommes >= 3;

// ERM
export const calculEcartRemunerationMoyenne = (
  remunerationAnnuelleBrutFemmes: number,
  remunerationAnnuelleBrutHommes: number
): number | undefined =>
  remunerationAnnuelleBrutFemmes > 0 && remunerationAnnuelleBrutHommes > 0
    ? roundDecimal(
        (remunerationAnnuelleBrutHommes - remunerationAnnuelleBrutFemmes) /
          remunerationAnnuelleBrutHommes,
        3
      )
    : undefined;

// ESP
export const calculEcartApresApplicationSeuilPertinence = (
  ecartRemunerationMoyenne: number | undefined
): number | undefined =>
  ecartRemunerationMoyenne !== undefined
    ? roundDecimal(
        Math.sign(ecartRemunerationMoyenne) *
          Math.max(0, Math.abs(ecartRemunerationMoyenne) - seuilPertinence),
        3
      )
    : undefined;

interface effectifEtEcartRemuGroup extends effectifGroup {
  trancheAge: TranchesAges;
  remunerationAnnuelleBrutFemmes: number;
  remunerationAnnuelleBrutHommes: number;
  ecartRemunerationMoyenne: number | undefined;
  ecartApresApplicationSeuilPertinence: number | undefined;
}

export const calculEffectifsEtEcartRemuParTrancheAge = (
  state: Array<Groupe>
): Array<effectifEtEcartRemuGroup> => {
  const dataByRow = state.reduce(
    (acc: Array<GroupTranchesAges>, group) => acc.concat(group.tranchesAges),
    []
  );

  const computedDataByRow = dataByRow.map(
    (groupTrancheAge: GroupTranchesAges) => {
      const remunerationAnnuelleBrutFemmes =
        groupTrancheAge.remunerationAnnuelleBrutFemmes || 0;
      const remunerationAnnuelleBrutHommes =
        groupTrancheAge.remunerationAnnuelleBrutHommes || 0;

      const effectifs = rowEffectifsParTrancheAge(
        groupTrancheAge,
        calculValiditeGroupe
      );

      // ERM
      const ecartRemunerationMoyenne = calculEcartRemunerationMoyenne(
        remunerationAnnuelleBrutFemmes,
        remunerationAnnuelleBrutHommes
      );
      // ESP
      const ecartApresApplicationSeuilPertinence = calculEcartApresApplicationSeuilPertinence(
        ecartRemunerationMoyenne
      );

      return {
        ...effectifs,
        trancheAge: groupTrancheAge.trancheAge,
        remunerationAnnuelleBrutFemmes,
        remunerationAnnuelleBrutHommes,
        ecartRemunerationMoyenne,
        ecartApresApplicationSeuilPertinence
      };
    }
  );

  return computedDataByRow;
};

export const calculEcartsPonderesParTrancheAge = calculEcartsPonderesParGroupe(
  ({ ecartApresApplicationSeuilPertinence }) =>
    ecartApresApplicationSeuilPertinence
);

// IER
export const calculIndicateurEcartRemuneration = (
  indicateurCalculable: boolean,
  totalEcartPondere: number | undefined
): number | undefined =>
  indicateurCalculable && totalEcartPondere !== undefined
    ? roundDecimal(100 * totalEcartPondere, 3)
    : undefined;

export const calculIndicateurSexeSousRepresente = (
  indicateurEcartRemuneration: number | undefined
): "hommes" | "femmes" | undefined =>
  indicateurEcartRemuneration !== undefined
    ? Math.sign(indicateurEcartRemuneration) < 0
      ? "femmes"
      : "hommes"
    : undefined;

export const calculIndicateurEcartRemunerationAbsolute = (
  indicateurEcartRemuneration: number | undefined
): number | undefined =>
  indicateurEcartRemuneration !== undefined
    ? Math.abs(indicateurEcartRemuneration)
    : undefined;

// NOTE
export const calculNote = (
  indicateurEcartRemuneration: number | undefined
): number | undefined =>
  indicateurEcartRemuneration !== undefined
    ? baremeEcartRemuneration[
        Math.min(
          baremeEcartRemuneration.length - 1,
          Math.ceil(Math.max(0, indicateurEcartRemuneration))
        )
      ]
    : undefined;

/////////
// ALL //
/////////

export default function calculIndicateurUn(state: AppState) {
  const effectifEtEcartRemuParTranche = calculEffectifsEtEcartRemuParTrancheAge(
    state.data
  );

  const { totalNombreSalaries, totalEffectifsValides } = calculTotalEffectifs(
    effectifEtEcartRemuParTranche
  );

  const ecartsPonderesByRow = calculEcartsPonderesParTrancheAge(
    effectifEtEcartRemuParTranche,
    totalEffectifsValides
  );

  // TEP
  const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow);

  // IC
  const effectifsIndicateurCalculable = calculEffectifsIndicateurCalculable(
    totalNombreSalaries,
    totalEffectifsValides
  );

  // IER
  const indicateurEcartRemuneration = calculIndicateurEcartRemuneration(
    effectifsIndicateurCalculable,
    totalEcartPondere
  );

  const indicateurEcartRemunerationAbsolute = calculIndicateurEcartRemunerationAbsolute(
    indicateurEcartRemuneration
  );

  const indicateurSexeSurRepresente = calculIndicateurSexeSousRepresente(
    indicateurEcartRemuneration
  );

  // NOTE
  const noteIndicateurUn = calculNote(indicateurEcartRemuneration);

  return {
    effectifsIndicateurCalculable,
    indicateurEcartRemuneration: indicateurEcartRemunerationAbsolute,
    indicateurSexeSurRepresente,
    noteIndicateurUn
  };
}
