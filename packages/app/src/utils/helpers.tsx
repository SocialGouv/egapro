import {
  addYears,
  addDays,
  format,
  parse as rootParse,
  parseISO
} from "date-fns";

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

export function displaySexeSurRepresente(
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
): string {
  return indicateurSexeSurRepresente !== undefined
    ? `écart favorable aux ${indicateurSexeSurRepresente}`
    : "les femmes et les hommes sont à égalité";
}

/* Utils */

export const roundDecimal = (num: number, decimal: number): number => {
  const mult = Math.pow(10, decimal);
  return Math.round(num * mult) / mult;
};

export const fractionToPercentage = (num: number) => roundDecimal(num * 100, 5);

export const percentageToFraction = (num: number) => roundDecimal(num / 100, 5);

/* Dates */

export function parseDate(dateStr: string): Date | undefined {
  const parsed = parseISO(dateStr);
  if (parsed.toString() === "Invalid Date") {
    const rootParsed = rootParse(dateStr, "dd/MM/yyyy", new Date());
    if (rootParsed.toString() === "Invalid Date") {
      return;
    }
    return rootParsed;
  }
  return parsed;
}

export function dateToString(date: Date | undefined): string {
  return date !== undefined ? format(date, "dd/MM/yyyy") : "";
}

export enum Year {
  Add,
  Subtract
}

// Return a date that is exactly one year later or before:
// Eg: one year in the future: 2019-01-01 -> 2019-12-31
export function calendarYear(
  dateStr: string,
  operation: Year,
  numYears: number
): string {
  // Adding a year: we subtract a day to the final result.
  // Subtracting a year: we add a day to the final result.
  const year = operation === Year.Add ? numYears : -numYears;
  const day = operation === Year.Add ? -1 : 1;
  const date = parseDate(dateStr);
  if (date === undefined) {
    return "";
  }
  const yearsAdded = addYears(date, year);
  const dayAdded = addDays(yearsAdded, day);
  return format(dayAdded, "dd/MM/yyyy");
}

/* Misc */

export const messageEcartNombreEquivalentSalaries = (
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined,
  plusPetitNombreSalaries: "hommes" | "femmes" | undefined
): string => {
  if (
    indicateurSexeSurRepresente === "hommes" &&
    plusPetitNombreSalaries === "femmes"
  ) {
    return "* si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes.";
  } else if (
    indicateurSexeSurRepresente === "hommes" &&
    plusPetitNombreSalaries === "hommes"
  ) {
    return "* si ce nombre d'hommes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes.";
  } else if (
    indicateurSexeSurRepresente === "hommes" &&
    plusPetitNombreSalaries === undefined
  ) {
    return "* si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes.";
  } else if (
    indicateurSexeSurRepresente === "femmes" &&
    plusPetitNombreSalaries === "femmes"
  ) {
    return "* si ce nombre de femmes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes.";
  } else if (
    indicateurSexeSurRepresente === "femmes" &&
    plusPetitNombreSalaries === "hommes"
  ) {
    return "* si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes.";
  } else if (
    indicateurSexeSurRepresente === "femmes" &&
    plusPetitNombreSalaries === undefined
  ) {
    return "* si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes.";
  } else {
    return "";
  }
};

export const messageMesureCorrection = (
  sexeSurRepresente: undefined | "femmes" | "hommes",
  ecartDe: string,
  noteMax: string
) => {
  return sexeSurRepresente === "femmes"
    ? `** L’écart de taux ${ecartDe} est en faveur des femmes tandis que l’écart de rémunération est en faveur des hommes, donc l’écart de taux ${ecartDe} est considéré comme une mesure de correction. La note obtenue est de ${noteMax}.`
    : sexeSurRepresente === "hommes"
    ? `** L’écart de taux ${ecartDe} est en faveur des hommes tandis que l’écart de rémunération est en faveur des femmes, donc l’écart de taux ${ecartDe} est considéré comme une mesure de correction. La note obtenue est de ${noteMax}.`
    : "";
};
