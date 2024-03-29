import { CSP, SexeType, TrancheAge } from "../globals"

export function displayNameTranchesAges(trancheAge: TrancheAge): string {
  switch (trancheAge) {
    case TrancheAge.MoinsDe30ans:
      return "moins de 30 ans"
    case TrancheAge.De30a39ans:
      return "30 à 39 ans"
    case TrancheAge.De40a49ans:
      return "40 à 49 ans"
    case TrancheAge.PlusDe50ans:
      return "50 ans et plus"
    default:
      return "ERROR"
  }
}

export function displayNameCSP(categorieSocioPro: CSP): string {
  switch (categorieSocioPro) {
    case CSP.Ouvriers:
      return "ouvriers"
    case CSP.Employes:
      return "employés"
    case CSP.Techniciens:
      return "techniciens et agents de maîtrise"
    case CSP.Cadres:
      return "ingénieurs et cadres"
    default:
      return "ERROR"
  }
}

/**
 * Display a percent.
 *
 * @param num a number between 0 and 100.
 * @param digits number of digits after the comma.
 */
export function displayPercent(num: number, digits = 1): string {
  return num.toLocaleString("fr-FR", { maximumFractionDigits: digits }) + "%"
}

/**
 * Display a float representing a fraction percent.
 *
 * @param num a number between 0 and 1.
 * @param digits number of digits after the comma.
 */
export function displayFractionPercent(num: number, digits = 2): string {
  return displayPercent(num * 100, digits)
}

/**
 * Display a float representing a fraction percent with "NC" if the number is undefined.
 *
 * @param num a number between 0 and 1 or undefined.
 * @param digits number of digits after the comma.
 */
export function displayFractionPercentWithEmptyData(num?: number, digits = 2): string {
  return typeof num === "number" ? displayFractionPercent(num, digits) : "NC"
}

export function displayInt(num: number): string {
  return num.toLocaleString("fr-FR")
}

export function displaySexeSurRepresente(indicateurSexeSurRepresente?: SexeType): string {
  return indicateurSexeSurRepresente !== undefined
    ? `écart favorable aux ${indicateurSexeSurRepresente}`
    : "les femmes et les hommes sont à égalité"
}

export const messageEcartNombreEquivalentSalaries = (
  indicateurSexeSurRepresente?: SexeType,
  plusPetitNombreSalaries?: SexeType,
): string => {
  if (indicateurSexeSurRepresente === "hommes" && plusPetitNombreSalaries === "femmes") {
    return "* si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else if (indicateurSexeSurRepresente === "hommes" && plusPetitNombreSalaries === "hommes") {
    return "* si ce nombre d'hommes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else if (indicateurSexeSurRepresente === "hommes" && plusPetitNombreSalaries === undefined) {
    return "* si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else if (indicateurSexeSurRepresente === "femmes" && plusPetitNombreSalaries === "femmes") {
    return "* si ce nombre de femmes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else if (indicateurSexeSurRepresente === "femmes" && plusPetitNombreSalaries === "hommes") {
    return "* si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else if (indicateurSexeSurRepresente === "femmes" && plusPetitNombreSalaries === undefined) {
    return "* si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes."
  } else {
    return ""
  }
}

export const messageMesureCorrection = (
  sexeSurRepresente: undefined | SexeType,
  ecartDe: string,
  noteMax: string,
): string => {
  return sexeSurRepresente === "femmes"
    ? `** L’écart de taux ${ecartDe} est en faveur des femmes tandis que l’écart de rémunération est en faveur des hommes, donc l’écart de taux ${ecartDe} est considéré comme une mesure de correction. La note obtenue est de ${noteMax}.`
    : sexeSurRepresente === "hommes"
    ? `** L’écart de taux ${ecartDe} est en faveur des hommes tandis que l’écart de rémunération est en faveur des femmes, donc l’écart de taux ${ecartDe} est considéré comme une mesure de correction. La note obtenue est de ${noteMax}.`
    : ""
}

/**
 * Helper to know if the index is "calculable".
 * Also used as a type predicate to remove the undefined in condition.
 *
 * @param noteIndex
 * @returns number only
 */
export const estCalculable = (noteIndex?: number): noteIndex is number => {
  return noteIndex !== undefined
}
