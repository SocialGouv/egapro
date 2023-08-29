import { RemunerationsMode } from "../domain/valueObjects/declaration/indicators/RemunerationsMode";
import { AbstractGroupComputer, type TotalMetadata } from "./AbstractGroupComputer";

export type CountAndAverageSalaries = {
  menCount: number;
  // default: 0 nonnegative
  menSalary: number;
  womenCount: number;
  // default: 0 nonnegative
  womenSalary: number;
};

export type InputRemunerations = Record<string, CountAndAverageSalaries>;

const CSP_THRESHOLD = 5;
const OTHER_THRESHOLD = 2;

interface AdditionalMetadata {
  averageMenSalary: number;
  averageWomenSalary: number;
  sumProductMenSalary: number;
  sumProductWomenSalary: number;
}

export type IndicateurUnComputerTotalMetadata = TotalMetadata<string, AdditionalMetadata>;

export class IndicateurUnComputer extends AbstractGroupComputer<InputRemunerations, AdditionalMetadata> {
  public NOTE_TABLE = [40, 39, 38, 37, 36, 35, 34, 33, 31, 29, 27, 25, 23, 21, 19, 17, 14, 11, 8, 5, 2, 0];
  public VALID_GROUPS_THRESHOLD = 0.4;
  public GROUP_COUNT_THRESHOLD = 3;
  private mode?: RemunerationsMode.Enum;

  constructor() {
    super();
  }

  public setMode(mode: RemunerationsMode.Enum): void {
    this.mode = mode;
  }

  protected addAdditionalMetadata(
    category: CountAndAverageSalaries,
    currentMetadata: IndicateurUnComputerTotalMetadata,
  ): void {
    if (typeof currentMetadata.additionalMetadata.averageMenSalary === "undefined") {
      currentMetadata.additionalMetadata.averageMenSalary = 0;
    }
    if (typeof currentMetadata.additionalMetadata.averageWomenSalary === "undefined") {
      currentMetadata.additionalMetadata.averageWomenSalary = 0;
    }
    if (typeof currentMetadata.additionalMetadata.sumProductMenSalary === "undefined") {
      currentMetadata.additionalMetadata.sumProductMenSalary = 0;
    }
    if (typeof currentMetadata.additionalMetadata.sumProductWomenSalary === "undefined") {
      currentMetadata.additionalMetadata.sumProductWomenSalary = 0;
    }

    if (category.menCount < this.GROUP_COUNT_THRESHOLD || category.womenCount < this.GROUP_COUNT_THRESHOLD) {
      return;
    }

    currentMetadata.additionalMetadata.sumProductMenSalary += category.menSalary * category.menCount;
    currentMetadata.additionalMetadata.sumProductWomenSalary += category.womenSalary * category.womenCount;

    currentMetadata.additionalMetadata.averageMenSalary =
      currentMetadata.additionalMetadata.sumProductMenSalary / currentMetadata.totalMenCount || 0;
    currentMetadata.additionalMetadata.averageWomenSalary =
      currentMetadata.additionalMetadata.sumProductWomenSalary / currentMetadata.totalWomenCount || 0;
  }

  /**
   * Vérifie si l'écart de rémunération peut être calculé pour un groupe spécifique.
   */
  public canComputeGroup(key: string): boolean {
    if (!this.input) {
      return false;
    }
    const ageGroup = this.input[key];

    if (
      !ageGroup ||
      !(
        ageGroup.menCount >= this.GROUP_COUNT_THRESHOLD &&
        ageGroup.womenCount >= this.GROUP_COUNT_THRESHOLD &&
        ageGroup.menSalary &&
        ageGroup.womenSalary
      )
    ) {
      return false;
    }

    return true;
  }

  /**
   * Calcule l'écart pondéré pour un groupe donné.
   */
  protected calculateWeightedGap(key: string): number {
    let group: CountAndAverageSalaries;
    if (this.groupWeightedGaps.has(key)) {
      group = this.groupWeightedGaps.get(key)!;
    }

    if (!this.input) {
      throw new Error("remunerations must be set before calling calculateWeightedGap");
    }

    if (!this.mode) {
      throw new Error("mode (csp, or other) must be set before calling calculateWeightedGap");
    }

    group = this.input[key] ?? {
      menCount: 0,
      menSalary: 0,
      womenCount: 0,
      womenSalary: 0,
    };

    let gap = ((group.menSalary - group.womenSalary) / group.menSalary) * 100;
    gap = isFinite(gap) ? gap : 0;
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
}
