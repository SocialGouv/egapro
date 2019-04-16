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

export function displayPercent(num: number, digits: number = 2): string {
  return (num * 100).toFixed(digits) + "%";
}
