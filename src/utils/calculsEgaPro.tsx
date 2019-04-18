import {
  TranchesAges,
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionType,
  ActionEffectifData
} from "../globals.d";

/* EFFECTIF CONST */

const tauxEffectifValide = 40 / 100;

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

/* INDICATEUR 2 CONST */

const baremEcartAugmentation = [20, 20, 20, 10, 10, 10, 5, 5, 5, 5, 5, 0];

/* Utils */

export const roundDecimal = (num: number, decimal: number): number => {
  const mult = Math.pow(10, decimal);
  return Math.round(num * mult) / mult;
};

//////////////////
// COMMON ////////
//////////////////

// EV
export const calculEffectifsValides = (
  validiteGroupe: boolean,
  nombreSalariesFemmes: number,
  nombreSalariesHommes: number
): number => (validiteGroupe ? nombreSalariesFemmes + nombreSalariesHommes : 0);

// EP
export const calculEcartPondere = (
  validiteGroupe: boolean,
  ecartPourcentage: number | undefined,
  effectifsValides: number,
  totalEffectifsValides: number
): number | undefined =>
  validiteGroupe && totalEffectifsValides > 0 && ecartPourcentage !== undefined
    ? roundDecimal(
        (ecartPourcentage * effectifsValides) / totalEffectifsValides,
        3
      )
    : undefined;

export const calculEcartsPonderesParGroupe = (
  findEcartPourcentage: (groupEffectifEtEcartAugment: {
    validiteGroupe: boolean;
    effectifsValides: number;
    ecartTauxAugmentation: number | undefined;
  }) => number | undefined
) => (
  groupEffectifEtEcartAugment: Array<{
    validiteGroupe: boolean;
    effectifsValides: number;
    ecartTauxAugmentation: number | undefined;
  }>,
  totalEffectifsValides: number
) =>
  groupEffectifEtEcartAugment
    .filter(({ validiteGroupe }) => validiteGroupe)
    .map(effectifEtEcart => {
      const { validiteGroupe, effectifsValides } = effectifEtEcart;
      const ecartPourcentage = findEcartPourcentage(effectifEtEcart);
      // EP
      const ecartPondere = calculEcartPondere(
        validiteGroupe,
        ecartPourcentage,
        effectifsValides,
        totalEffectifsValides
      );

      return ecartPondere;
    });

// TEP
export const calculTotalEcartPondere = (
  tableauEcartsPonderes: Array<number | undefined>
): number | undefined =>
  tableauEcartsPonderes.length === 0 ||
  tableauEcartsPonderes.includes(undefined)
    ? undefined
    : roundDecimal(
        tableauEcartsPonderes
          .filter(ecartPondere => ecartPondere !== undefined)
          .reduce(
            (acc, val) => (acc || 0) + (val !== undefined ? val : 0),
            undefined
          ) || 0,
        3
      );

//////////////////
// EFFECTIFS /////
//////////////////

//export const calculEffectifsParTrancheAge = () =>

export interface effectifGroup {
  nombreSalariesFemmes: number;
  nombreSalariesHommes: number;
  validiteGroupe: boolean;
  effectifsValides: number;
}

export const rowEffectifsParCategorieSocioPro = (
  tranchesAges: Array<GroupTranchesAges>,
  calculValiditeGroupe: (
    nombreSalariesFemmes: number,
    nombreSalariesHommes: number
  ) => boolean
): effectifGroup => {
  const {
    nombreSalariesFemmesGroupe,
    nombreSalariesHommesGroupe
  } = tranchesAges.reduce(
    (
      { nombreSalariesFemmesGroupe, nombreSalariesHommesGroupe },
      { nombreSalariesFemmes, nombreSalariesHommes }
    ) => ({
      nombreSalariesFemmesGroupe:
        nombreSalariesFemmesGroupe + (nombreSalariesFemmes || 0),
      nombreSalariesHommesGroupe:
        nombreSalariesHommesGroupe + (nombreSalariesHommes || 0)
    }),
    { nombreSalariesFemmesGroupe: 0, nombreSalariesHommesGroupe: 0 }
  );

  // VG
  const validiteGroupe = calculValiditeGroupe(
    nombreSalariesFemmesGroupe,
    nombreSalariesHommesGroupe
  );
  // EV
  const effectifsValides = calculEffectifsValides(
    validiteGroupe,
    nombreSalariesFemmesGroupe,
    nombreSalariesHommesGroupe
  );

  return {
    nombreSalariesFemmes: nombreSalariesFemmesGroupe,
    nombreSalariesHommes: nombreSalariesHommesGroupe,
    validiteGroupe,
    effectifsValides
  };
};

export const calculTotalEffectifs = (groupEffectif: Array<effectifGroup>) => {
  const {
    totalNombreSalariesFemmes,
    totalNombreSalariesHommes
  } = groupEffectif.reduce(
    (
      { totalNombreSalariesFemmes, totalNombreSalariesHommes },
      { nombreSalariesFemmes, nombreSalariesHommes }
    ) => {
      return {
        totalNombreSalariesFemmes:
          totalNombreSalariesFemmes + nombreSalariesFemmes,
        totalNombreSalariesHommes:
          totalNombreSalariesHommes + nombreSalariesHommes
      };
    },
    {
      totalNombreSalariesFemmes: 0, //TNBF
      totalNombreSalariesHommes: 0 //TNBH
    }
  );

  // TNB
  const totalNombreSalaries =
    totalNombreSalariesFemmes + totalNombreSalariesHommes;

  // TEV
  const totalEffectifsValides = groupEffectif.reduce(
    (acc, { effectifsValides }) => acc + effectifsValides,
    0
  );

  return {
    totalNombreSalariesFemmes,
    totalNombreSalariesHommes,
    totalNombreSalaries,
    totalEffectifsValides
  };
};

//////////////////
// INDICATEUR 1 //
//////////////////

// VG
export const calculValiditeGroupeIndicateurUn = (
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

// IC
export const calculIndicateurUnCalculable = (
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
export const calculNoteIndicateurUn = (
  indicateurEcartRemuneration: number | undefined
): number | undefined =>
  indicateurEcartRemuneration !== undefined
    ? baremeEcartRemuneration[
        Math.min(21, Math.ceil(Math.max(0, indicateurEcartRemuneration)))
      ]
    : undefined;
