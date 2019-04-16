/* INDICATEUR 1 */

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

const roundDecimal = (num: number, decimal: number): number => {
  const mult = Math.pow(10, decimal);
  return Math.round(num * mult) / mult;
};

// VG
export const calculValiditeGroupe = (
  nombreSalariesFemmes: number,
  nombreSalariesHommes: number
): boolean => nombreSalariesFemmes >= 3 && nombreSalariesHommes >= 3;

// EV
export const calculEffectifsValides = (
  validiteGroupe: boolean,
  nombreSalariesFemmes: number,
  nombreSalariesHommes: number
): number => (validiteGroupe ? nombreSalariesFemmes + nombreSalariesHommes : 0);

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

// EP
export const calculEcartPondere = (
  validiteGroupe: boolean,
  ecartApresApplicationSeuilPertinence: number | undefined,
  effectifsValides: number,
  totalEffectifsValides: number
): number | undefined =>
  validiteGroupe &&
  totalEffectifsValides > 0 &&
  ecartApresApplicationSeuilPertinence !== undefined
    ? roundDecimal(
        (ecartApresApplicationSeuilPertinence * effectifsValides) /
          totalEffectifsValides,
        3
      )
    : undefined;

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
        Math.min(21, Math.ceil(Math.max(0, indicateurEcartRemuneration)))
      ]
    : undefined;
