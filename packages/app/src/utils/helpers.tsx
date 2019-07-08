import { TranchesAges, CategorieSocioPro } from "../globals.d";

export function displayNameTranchesAges(trancheAge: TranchesAges): string {
  switch (trancheAge) {
    case TranchesAges.MoinsDe30ans:
      return "moins de 30 ans";
    case TranchesAges.De30a39ans:
      return "30 à 39 ans";
    case TranchesAges.De40a49ans:
      return "40 à 49 ans";
    case TranchesAges.PlusDe50ans:
      return "50 ans et plus";
    default:
      return "ERROR";
  }
}

export function displayNameCategorieSocioPro(
  categorieSocioPro: CategorieSocioPro
): string {
  switch (categorieSocioPro) {
    case CategorieSocioPro.Ouvriers:
      return "ouvriers";
    case CategorieSocioPro.Employes:
      return "employés";
    case CategorieSocioPro.Techniciens:
      return "techniciens et agents de maîtrise";
    case CategorieSocioPro.Cadres:
      return "ingénieurs et cadres";
    default:
      return "ERROR";
  }
}

export function displayFractionPercent(
  num: number,
  digits: number = 2
): string {
  return displayPercent(num * 100, digits);
}

export function displayPercent(num: number, digits: number = 1): string {
  return num.toLocaleString("en-US", { maximumFractionDigits: digits }) + "%";
}

export function displayInt(num: number): string {
  return num.toLocaleString("fr-FR");
}

/* Utils */

export const roundDecimal = (num: number, decimal: number): number => {
  const mult = Math.pow(10, decimal);
  return Math.round(num * mult) / mult;
};

export const fractionToPercentage = (num: number) => roundDecimal(num * 100, 5);

export const percentageToFraction = (num: number) => roundDecimal(num / 100, 5);
