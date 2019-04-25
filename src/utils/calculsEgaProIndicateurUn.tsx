import { TranchesAges, Groupe, GroupTranchesAges } from "../globals.d";

import { roundDecimal } from "./helpers";

import {
  tauxEffectifValide,
  calculEcartsPonderesParGroupe,
  calculTotalEcartPondere,
  calculTotalEffectifs,
  rowEffectifsParTrancheAge,
  effectifGroup
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
  calculTotalEcartPondere // TEV
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

// IC
export const calculIndicateurCalculable = (
  totalNombreSalaries: number,
  totalEffectifsValides: number
): boolean =>
  totalNombreSalaries > 0 &&
  totalEffectifsValides >= totalNombreSalaries * tauxEffectifValide;

// IER
export const calculIndicateurEcartRemuneration = (
  indicateurCalculable: boolean,
  totalEcartPondere: number | undefined
): number | undefined =>
  indicateurCalculable && totalEcartPondere !== undefined
    ? roundDecimal(100 * totalEcartPondere, 3)
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
