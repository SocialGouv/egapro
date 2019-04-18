import {
  TranchesAges,
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionType,
  ActionEffectifData
} from "../globals.d";

/* INDICATEUR 1 CONST */

const tauxEffectifValide = 40 / 100;

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

const roundDecimal = (num: number, decimal: number): number => {
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

const calculEcartsPonderesParGroupe = (
  findEcartPourcentage: (
    groupEffectifEtEcartAugment: effectifEtEcartAugmentGroup
  ) => number | undefined
) => (
  groupEffectifEtEcartAugment: Array<effectifEtEcartAugmentGroup>,
  totalEffectifsValides: number
) =>
  groupEffectifEtEcartAugment
    .filter(({ validiteGroupe }: { validiteGroupe: boolean }) => validiteGroupe)
    .map(effectifEtEcartAugment => {
      const { validiteGroupe, effectifsValides } = effectifEtEcartAugment;
      const ecartPourcentage = findEcartPourcentage(effectifEtEcartAugment);
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

interface effectifGroup {
  nombreSalariesFemmes: number;
  nombreSalariesHommes: number;
  validiteGroupe: boolean;
  effectifsValides: number;
}

const rowEffectifsParCategorieSocioPro = (
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

//////////////////
// INDICATEUR 2 //
//////////////////

// VG
export const calculValiditeGroupeIndicateurDeux = (
  nombreSalariesFemmes: number,
  nombreSalariesHommes: number
): boolean => nombreSalariesFemmes >= 10 && nombreSalariesHommes >= 10;

// ETA
export const calculEcartTauxAugmentation = (
  nombreSalariesFemmes: number,
  nombreSalariesHommes: number
): number | undefined =>
  nombreSalariesFemmes > 0 && nombreSalariesHommes > 0
    ? roundDecimal(nombreSalariesHommes - nombreSalariesFemmes, 3)
    : undefined;

interface effectifEtEcartAugmentGroup extends effectifGroup {
  categorieSocioPro: CategorieSocioPro;
  tauxAugmentationFemmes: number;
  tauxAugmentationHommes: number;
  ecartTauxAugmentation: number | undefined;
}

export const calculIndicateurDeuxEffectifsEtEcartAugmentParCategorieSocioPro = (
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
        calculValiditeGroupeIndicateurDeux
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

export const calculIndicateurDeuxTotalEffectifsEtTauxAugmentation = (
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

export const calculIndicateurDeuxEcartsPonderesParCategorieSocioPro = calculEcartsPonderesParGroupe(
  ({ ecartTauxAugmentation }) => ecartTauxAugmentation
);

// IC
export const calculIndicateurDeuxCalculable = (
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
export const calculNoteIndicateurDeux = (
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
