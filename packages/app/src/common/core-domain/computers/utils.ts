import { CSP } from "../domain/valueObjects/CSP";
import { AgeRange } from "../domain/valueObjects/declaration/AgeRange";
import { type CountAndAverageSalaries, type InputRemunerations } from "./IndicateurUnComputer";

// --- Indicateur 1 utils
export const categories = [
  CSP.Enum.OUVRIERS,
  CSP.Enum.EMPLOYES,
  CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
  CSP.Enum.INGENIEURS_CADRES,
] as const;
export const ageRanges = [
  AgeRange.Enum.LESS_THAN_30,
  AgeRange.Enum.FROM_30_TO_39,
  AgeRange.Enum.FROM_40_TO_49,
  AgeRange.Enum.FROM_50_TO_MORE,
] as const;

export type ExternalRemunerations = Array<{
  category: Record<AgeRange.Enum, CountAndAverageSalaries>;
  name: string;
}>;

export function flattenRemunerations(remunerations: ExternalRemunerations): InputRemunerations {
  const flattened: InputRemunerations = {};
  for (const { name, category } of remunerations) {
    if (category) {
      for (const [ageRange, ageGroup] of Object.entries(category)) {
        flattened[buildRemunerationKey(name, ageRange as AgeRange.Enum)] = ageGroup;
      }
    }
  }
  return flattened;
}

export function buildRemunerationKey(categoryName: string, ageRange: AgeRange.Enum): string {
  return `${categoryName}:${ageRange}`;
}
