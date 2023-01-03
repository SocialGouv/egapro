import { CategorieSocioPro, TranchesAges } from "../globals"

export function displayNameTranchesAges(trancheAge: TranchesAges): string {
  switch (trancheAge) {
    case TranchesAges.MoinsDe30ans:
      return "moins de 30 ans"
    case TranchesAges.De30a39ans:
      return "30 à 39 ans"
    case TranchesAges.De40a49ans:
      return "40 à 49 ans"
    case TranchesAges.PlusDe50ans:
      return "50 ans et plus"
    default:
      return "ERROR"
  }
}

export function displayNameCategorieSocioPro(categorieSocioPro: CategorieSocioPro): string {
  switch (categorieSocioPro) {
    case CategorieSocioPro.Ouvriers:
      return "ouvriers"
    case CategorieSocioPro.Employes:
      return "employés"
    case CategorieSocioPro.Techniciens:
      return "techniciens et agents de maîtrise"
    case CategorieSocioPro.Cadres:
      return "ingénieurs et cadres"
    default:
      return "ERROR"
  }
}

export function displayFractionPercent(num: number, digits = 2): string {
  return displayPercent(num * 100, digits)
}

export function displayFractionPercentWithEmptyData(num?: number, digits = 2): string {
  return typeof num === "number" ? displayFractionPercent(num, digits) : "NC"
}

export function displayPercent(num: number, digits = 1): string {
  return num.toLocaleString("fr-FR", { maximumFractionDigits: digits }) + "%"
}

export function displayInt(num: number): string {
  return num.toLocaleString("fr-FR")
}

export function displaySexeSurRepresente(indicateurSexeSurRepresente: "hommes" | "femmes" | undefined): string {
  return indicateurSexeSurRepresente !== undefined
    ? `écart favorable aux ${indicateurSexeSurRepresente}`
    : "les femmes et les hommes sont à égalité"
}

export const messageEcartNombreEquivalentSalaries = (
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined,
  plusPetitNombreSalaries: "hommes" | "femmes" | undefined,
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
  sexeSurRepresente: undefined | "femmes" | "hommes",
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
export const estCalculable = (noteIndex: number | undefined): noteIndex is number => {
  return noteIndex !== undefined
}
