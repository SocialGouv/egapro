import {
  TranchesAges,
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionType,
  ActionEffectifData
} from "../globals.d";

/* EFFECTIF CONST */

export const tauxEffectifValide = 40 / 100;

/* Utils */

export const roundDecimal = (num: number, decimal: number): number => {
  const mult = Math.pow(10, decimal);
  return Math.round(num * mult) / mult;
};

//////////////////
// COMMON ////////
//////////////////

// EV
const calculEffectifsValides = (
  validiteGroupe: boolean,
  nombreSalariesFemmes: number,
  nombreSalariesHommes: number
): number => (validiteGroupe ? nombreSalariesFemmes + nombreSalariesHommes : 0);

// EP
const calculEcartPondere = (
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
    ecartTauxAugmentation?: number | undefined;
    ecartApresApplicationSeuilPertinence?: number | undefined;
  }) => number | undefined
) => (
  groupEffectifEtEcart: Array<{
    validiteGroupe: boolean;
    effectifsValides: number;
    ecartTauxAugmentation?: number | undefined;
    ecartApresApplicationSeuilPertinence?: number | undefined;
  }>,
  totalEffectifsValides: number
) =>
  groupEffectifEtEcart
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

export interface effectifGroup {
  nombreSalariesFemmes: number;
  nombreSalariesHommes: number;
  validiteGroupe: boolean;
  effectifsValides: number;
}

export const rowEffectifsParTrancheAge = (
  { nombreSalariesFemmes, nombreSalariesHommes }: GroupTranchesAges,
  calculValiditeGroupe: (
    nombreSalariesFemmes: number,
    nombreSalariesHommes: number
  ) => boolean
): effectifGroup => {
  nombreSalariesFemmes = nombreSalariesFemmes || 0;
  nombreSalariesHommes = nombreSalariesHommes || 0;

  // VG
  const validiteGroupe = calculValiditeGroupe(
    nombreSalariesFemmes,
    nombreSalariesHommes
  );
  // EV
  const effectifsValides = calculEffectifsValides(
    validiteGroupe,
    nombreSalariesFemmes,
    nombreSalariesHommes
  );

  return {
    nombreSalariesFemmes,
    nombreSalariesHommes,
    validiteGroupe,
    effectifsValides
  };
};

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
