import { CSP } from "../domain/valueObjects/CSP";
import { CSPAgeRange } from "../domain/valueObjects/declaration/simulation/CSPAgeRange";
import { type CountAndAverageSalaries, type InputRemunerations } from "./IndicateurUnComputer";

// --- Indicateur 1 utils
export const categories = [
  CSP.Enum.OUVRIERS,
  CSP.Enum.EMPLOYES,
  CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
  CSP.Enum.INGENIEURS_CADRES,
] as const;
export const ageRanges = [
  CSPAgeRange.Enum.LESS_THAN_30,
  CSPAgeRange.Enum.FROM_30_TO_39,
  CSPAgeRange.Enum.FROM_40_TO_49,
  CSPAgeRange.Enum.FROM_50_TO_MORE,
] as const;

export type ExternalRemunerations = Array<{
  category: Record<CSPAgeRange.Enum, CountAndAverageSalaries>;
  categoryId: string;
  name: string;
}>;

export function flattenRemunerations(remunerations: ExternalRemunerations): InputRemunerations {
  const flattened: InputRemunerations = {};
  for (const { categoryId, category } of remunerations) {
    if (category) {
      for (const [ageRange, ageGroup] of Object.entries(category)) {
        flattened[buildRemunerationKey(categoryId, ageRange as CSPAgeRange.Enum)] = ageGroup;
      }
    }
  }
  return flattened;
}

export function buildRemunerationKey(categoryId: string, ageRange: CSPAgeRange.Enum): string {
  return `${categoryId}:${ageRange}`;
}
