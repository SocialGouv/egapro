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

type CountAndAverageSalaries = {
  menCount: number;
  // default: 0 nonnegative
  menSalary: number;
  womenCount: number;
  // default: 0 nonnegative
  womenSalary: number;
};

// ---
type AgeRanges = Record<CSPAgeRange.Enum, CountAndAverageSalaries>;

interface Remunerations<TName extends string = string> {
  category: AgeRanges;
  id: string;
  name: TName;
}

// cas où RemunerationsMode.Enum = "csp"
export type RemunerationsCSP = Array<Remunerations<CSP.Enum>>;
// autres cas - "string" car la catégorie est libre
export type RemunerationsOther = Remunerations[];
export type RemunerationsCountAndAverageSalaries = CountAndAverageSalaries;

const CSP_THRESHOLD = 5;
const OTHER_THRESHOLD = 2;

const NOTE_TABLE = [40, 39, 38, 37, 36, 35, 34, 33, 31, 29, 27, 25, 23, 21, 19, 17, 14, 11, 8, 5, 2, 0];

interface TotalMetadata {
  averageMenSalary: number;
  averageWomenSalary: number;
  fillableGroups: Array<[string, CSPAgeRange.Enum]>;
  totalEmployeeCount: number;
  totalGroupCount: number;
  totalMenCount: number;
  totalWomenCount: number;
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
  private groupWeightedGaps: Map<`${string}:${CSPAgeRange.Enum}`, CountAndAverageSalaries> = new Map();

  constructor(private readonly mode: TMode) {}

  public setRemunerations(remunerations: TRemunerations) {
    this.remunerations = remunerations;
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

    let sumProductWomenSalary = 0;
    let sumProductMenSalary = 0;

    const validGroups: TotalMetadata["validGroups"] = [];
    const fillableGroups: TotalMetadata["fillableGroups"] = [];
    for (const { id, category } of this.remunerations) {
      for (const [ageRange, ageGroup] of Object.entries(category)) {
        const womenCount = ageGroup.womenCount || 0;
        const menCount = ageGroup.menCount || 0;
        totalEmployeeCount += menCount + womenCount;
        totalWomenCount += womenCount;
        totalMenCount += menCount;

        // Exclure les groupes qui n'ont pas au moins 3 hommes et 3 femmes,
        // et ceux où les salaires moyens sont à 0.
        if (ageGroup.menCount >= 3 && ageGroup.womenCount >= 3) {
          fillableGroups.push([id, ageRange as CSPAgeRange.Enum]);
          totalGroupCount += ageGroup.menCount + ageGroup.womenCount;
          if (ageGroup.womenSalary > 0) {
            sumProductWomenSalary += ageGroup.womenSalary * ageGroup.womenCount;
          }
          if (ageGroup.menSalary > 0) {
            sumProductMenSalary += ageGroup.menSalary * ageGroup.menCount;
          }
          if (ageGroup.menSalary > 0 && ageGroup.womenSalary > 0) {
            validGroups.push([id, ageRange as CSPAgeRange.Enum]);
          }
        }
      }
    }

    return {
      averageMenSalary: sumProductMenSalary / totalMenCount || 0,
      averageWomenSalary: sumProductWomenSalary / totalWomenCount || 0,
      totalEmployeeCount,
      totalGroupCount,
      totalMenCount,
      totalWomenCount,
      validGroups,
      fillableGroups,
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
    const { validGroups } = this.getTotalMetadata();
    for (const [id, ageRange] of validGroups) {
      const weightedGap = this.calculateWeightedGap(id, ageRange);
      totalWeightedGap += weightedGap;
    }

    this.computed = this.getResult(totalWeightedGap);
    return this.computed;
  }

  /**
   * Vériie si l'écart de rémunération peut être calculé pour un groupe spécifique.
   */
  public canComputeGroup(categoryId: string, group: keyof AgeRanges): boolean {
    if (!this.remunerations) {
      throw new Error("remunerations must be set before calling canComputeGroup");
    }
    const ageGroup = this.remunerations.find(rem => rem.id === categoryId)?.category[group];

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
  public computeGroup(categoryId: string, ageRange: keyof AgeRanges): Result {
    const weightedGap = this.calculateWeightedGap(categoryId, ageRange);
    return this.getResult(weightedGap);
  }

  /**
   * Calcule l'écart pondéré pour un groupe donné.
   */
  private calculateWeightedGap(id: string, ageRange: keyof AgeRanges): number {
    const key = `${id}:${ageRange}` as const;

    let group: CountAndAverageSalaries;
    if (this.groupWeightedGaps.has(key)) {
      group = this.groupWeightedGaps.get(key)!;
    }

    if (!this.remunerations) {
      throw new Error("remunerations must be set before calling canComputeGroup");
    }

    group = this.remunerations.find(rem => rem.id === id)?.category[ageRange] ?? {
      menCount: 0,
      menSalary: 0,
      womenCount: 0,
      womenSalary: 0,
    };

    const gap = ((group.menSalary - group.womenSalary) / group.menSalary) * 100;
    const threshold = this.mode === RemunerationsMode.Enum.CSP ? CSP_THRESHOLD : OTHER_THRESHOLD;

    let salaryGap;
    if (gap > 0) {
      salaryGap = Math.max(gap - threshold, 0);
    } else {
      salaryGap = Math.min(gap + threshold, 0);
    }

    const groupCount = group.menCount + group.womenCount;
    const { totalGroupCount } = this.getTotalMetadata();
    return salaryGap * (groupCount / totalGroupCount);
  }

  private getResult(weightedGap: number): Result {
    const sign = Math.sign(weightedGap);
    const result = Math.round(Math.abs(weightedGap) * 10) / 10;

    return {
      genderAdvantage: sign === 0 ? "equality" : sign === 1 ? "men" : "women",
      note: IndicateurUnComputer.computeNote(result),
      result,
    };
  }
}
