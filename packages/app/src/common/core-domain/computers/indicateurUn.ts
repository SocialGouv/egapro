import { isEqual } from "lodash";

import { CSP } from "../domain/valueObjects/CSP";
import { RemunerationsMode } from "../domain/valueObjects/declaration/indicators/RemunerationsMode";
import { CSPAgeRange } from "../domain/valueObjects/declaration/simulation/CSPAgeRange";

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

type CountAndAverageWages = {
  menCount: number;
  // default: 0 nonnegative
  menSalary: number;
  womenCount: number;
  // default: 0 nonnegative
  womenSalary: number;
};

// ---
type AgeRanges = Record<CSPAgeRange.Enum, CountAndAverageWages>;

// cas où RemunerationsMode.Enum = "csp"
export type RemunerationsCSP = Record<CSP.Enum, AgeRanges>;
// autres cas - "string" car la catégorie est libre
export type RemunerationsOther = Record<string, AgeRanges>;

const CSP_THRESHOLD = 5;
const OTHER_THRESHOLD = 2;

const NOTE_TABLE = [40, 39, 38, 37, 36, 35, 34, 33, 31, 29, 27, 25, 23, 21, 19, 17, 14, 11, 8, 5, 2, 0];

interface TotalMetadata {
  averageMenSalary: number;
  averageWomenSalary: number;
  totalEmployeeCount: number;
  totalGroupCount: number;
  totalMenCount: number;
  totalMenSalary: number;
  totalWomenCount: number;
  totalWomenSalary: number;
  validGroups: Array<[string, CSPAgeRange.Enum]>;
}

interface Result {
  genderAdvantage: "equality" | "men" | "women";
  note: number;
  result: number;
}

export type IndicateurUnComputerResult = Result;
export type IndicateurUnComputerTotalMetadata = TotalMetadata;

export class IndicateurUnComputer<
  TMode extends RemunerationsMode.Enum,
  TRemunerations extends TMode extends RemunerationsMode.Enum.CSP ? RemunerationsCSP : RemunerationsOther,
> {
  private remunerations?: RemunerationsOther;
  private totalMetadata?: TotalMetadata;
  private computed?: Result;
  private groupWeightedGaps: Map<`${string}:${CSPAgeRange.Enum}`, CountAndAverageWages> = new Map();

  constructor(private readonly mode: TMode) {}

  public setRemunerations(remunerations: TRemunerations) {
    if (isEqual(this.remunerations, remunerations)) {
      return;
    }

    this.remunerations = remunerations;
    // Si les remunerations ont changé, on supprime le cache
    delete this.totalMetadata;
    delete this.computed;
    this.groupWeightedGaps.clear();
  }

  public getTotalMetadata(): TotalMetadata {
    if (this.totalMetadata) {
      return this.totalMetadata;
    }

    if (!this.remunerations) {
      throw new Error("employees must be set before calling totalMetadata");
    }

    let totalEmployeeCount = 0;
    let totalWomenCount = 0;
    let totalMenCount = 0;
    let totalGroupCount = 0;

    let totalWomenSalary = 0;
    let totalMenSalary = 0;

    let countedGroupsWomen = 0;
    let countedGroupsMen = 0;

    const validGroups: TotalMetadata["validGroups"] = [];
    for (const [categoryName, category] of Object.entries(this.remunerations)) {
      for (const [ageRange, ageGroup] of Object.entries(category)) {
        totalEmployeeCount += ageGroup.menCount + ageGroup.womenCount;
        totalWomenCount += ageGroup.womenCount;
        totalMenCount += ageGroup.menCount;

        // Exclure les groupes qui n'ont pas au moins 3 hommes et 3 femmes,
        // et ceux où les salaires moyens sont à 0.
        if (ageGroup.menCount >= 3 && ageGroup.womenCount >= 3) {
          totalGroupCount += ageGroup.menCount + ageGroup.womenCount;
          if (ageGroup.womenSalary > 0) {
            totalWomenSalary += ageGroup.womenSalary;
            countedGroupsWomen++;
          }
          if (ageGroup.menSalary > 0) {
            totalMenSalary += ageGroup.menSalary;
            countedGroupsMen++;
          }
          if (ageGroup.menSalary > 0 && ageGroup.womenSalary > 0) {
            validGroups.push([categoryName, ageRange as CSPAgeRange.Enum]);
          }
        }
      }
    }

    return {
      averageMenSalary: totalMenSalary / countedGroupsMen || 0,
      averageWomenSalary: totalWomenSalary / countedGroupsWomen || 0,
      totalEmployeeCount,
      totalGroupCount,
      totalMenCount,
      totalMenSalary,
      totalWomenCount,
      totalWomenSalary,
      validGroups,
    };
  }

  /**
   * Calcule la note correspondant à l'écart de rémunération.
   */
  public static computeNote(result: number): number {
    const index = Math.ceil(result);

    if (index < 0 || index >= NOTE_TABLE.length) {
      return 0;
    }

    return NOTE_TABLE[index];
  }

  /**
   * Vérifie si l'écart de rémunération peut être calculé.
   */
  public canCompute(): boolean {
    if (!this.remunerations) {
      throw new Error("remunerations must be set before calling canComputeGroup");
    }

    const { totalEmployeeCount, totalGroupCount } = this.getTotalMetadata();

    return totalGroupCount / totalEmployeeCount >= 0.4;
  }

  /**
   * Calcule l'écart global de rémunération entre les femmes et les hommes.
   *
   * @returns Le résultat, avec la note et l'avantage de genre.
   */
  public compute(): Result {
    if (typeof this.computed !== "undefined") {
      return this.computed;
    }

    let totalWeightedGap = 0;
    for (const [category, ageRange] of this.getTotalMetadata().validGroups) {
      const weightedGap = this.calculateWeightedGap(category, ageRange);
      totalWeightedGap += weightedGap;
    }

    this.computed = this.getResult(totalWeightedGap);
    return this.computed;
  }

  /**
   * Vériie si l'écart de rémunération peut être calculé pour un groupe spécifique.
   */
  public canComputeGroup(category: keyof TRemunerations, group: keyof AgeRanges): boolean {
    if (!this.remunerations) {
      throw new Error("remunerations must be set before calling canComputeGroup");
    }
    const ageGroup = this.remunerations[category as string][group];

    if (
      !ageGroup ||
      !(ageGroup.menCount >= 3 && ageGroup.womenCount >= 3 && ageGroup.menSalary > 0 && ageGroup.womenSalary > 0)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Calcule l'écart de rémunération pondéré pour un groupe spécifique.
   */
  public computeGroup(category: keyof TRemunerations, ageRange: keyof AgeRanges): Result {
    const weightedGap = this.calculateWeightedGap(category as string, ageRange);
    return this.getResult(weightedGap);
  }

  /**
   * Calcule l'écart pondéré pour un groupe donné.
   */
  private calculateWeightedGap(category: string, ageRange: keyof AgeRanges): number {
    const key = `${category}:${ageRange}` as const;

    let group: CountAndAverageWages;
    if (this.groupWeightedGaps.has(key)) {
      group = this.groupWeightedGaps.get(key)!;
    }

    if (!this.remunerations) {
      throw new Error("remunerations must be set before calling canComputeGroup");
    }

    group = this.remunerations[category][ageRange];
    const gap = ((group.menSalary - group.womenSalary) / group.menSalary) * 100;
    const threshold = this.mode === RemunerationsMode.Enum.CSP ? CSP_THRESHOLD : OTHER_THRESHOLD;

    let wageGap;
    if (gap > 0) {
      wageGap = Math.max(gap - threshold, 0);
    } else {
      wageGap = Math.min(gap + threshold, 0);
    }

    const groupCount = group.menCount + group.womenCount;
    const { totalGroupCount } = this.getTotalMetadata();
    return wageGap * (groupCount / totalGroupCount);
  }

  private getResult(weightedGap: number): Result {
    const sign = Math.sign(weightedGap);
    const result = Math.ceil(Math.abs(weightedGap) * 10) / 10;

    return {
      genderAdvantage: sign === 0 ? "equality" : sign === 1 ? "men" : "women",
      note: IndicateurUnComputer.computeNote(result),
      result,
    };
  }
}
