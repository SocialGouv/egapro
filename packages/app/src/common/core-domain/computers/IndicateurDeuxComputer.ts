import { type CSP } from "../domain/valueObjects/CSP";

type CountAndAverageIncreases = {
  menCount: number;
  menIncreaseCount: number;
  womenCount: number;
  womenIncreaseCount: number;
};

export type Increases = Partial<Record<CSP.Enum, CountAndAverageIncreases>>;

const NOTE_TABLE = [20, 20, 20, 10, 10, 10, 5, 5, 5, 5, 5, 0];

interface TotalMetadata {
  totalEmployeeCount: number;
  totalGroupCount: number;
  validGroups: CSP.Enum[];
}

export interface Result {
  genderAdvantage: "equality" | "men" | "women";
  note: number;
  result: number;
  resultRaw: number;
}

export class IndicateurDeuxComputer {
  private increases?: Increases;
  private totalMetadata?: TotalMetadata;
  private computed?: Result;
  private groupWeightedGaps: Map<string, CountAndAverageIncreases> = new Map();

  public setIncreases(increases: Increases) {
    this.increases = increases;
    delete this.totalMetadata;
    delete this.computed;
    this.groupWeightedGaps.clear();
  }

  public getTotalMetadata(): TotalMetadata {
    if (this.totalMetadata) {
      return this.totalMetadata;
    }

    if (!this.increases) {
      throw new Error("increases must be set before calling totalMetadata");
    }

    let totalEmployeeCount = 0;
    let totalGroupCount = 0;

    const validGroups: TotalMetadata["validGroups"] = [];
    for (const [categoryId, category] of Object.entries(this.increases)) {
      const womenCount = category.womenCount || 0;
      const menCount = category.menCount || 0;
      totalEmployeeCount += menCount + womenCount;

      // Exclure les groupes qui n'ont pas au moins 10 hommes et 10 femmes.
      if (menCount >= 10 && womenCount >= 10) {
        validGroups.push(categoryId as CSP.Enum);
        totalGroupCount += menCount + womenCount;
      }
    }

    return {
      totalEmployeeCount,
      totalGroupCount,
      validGroups,
    };
  }

  public static computeNote(result: number): number {
    const index = Math.ceil(result);

    if (index < 0 || index >= NOTE_TABLE.length) {
      return 0;
    }

    return NOTE_TABLE[index];
  }

  public canCompute(): boolean {
    if (!this.increases) {
      return false;
    }

    const { totalEmployeeCount, totalGroupCount } = this.getTotalMetadata();

    return totalGroupCount / totalEmployeeCount >= 0.4;
  }

  public compute(): Result {
    if (this.computed) {
      return this.computed;
    }

    let totalWeightedGap = 0;
    const { validGroups } = this.getTotalMetadata();
    for (const categoryId of validGroups) {
      const weightedGap = this.calculateWeightedGap(categoryId);
      totalWeightedGap += weightedGap;
    }

    this.computed = this.getResult(totalWeightedGap);
    return this.computed;
  }

  public canComputeGroup(categoryId: CSP.Enum): boolean {
    if (!this.increases) {
      return false;
    }
    const category = this.increases[categoryId]!;

    if (
      !(
        category.menCount >= 10 &&
        category.womenCount >= 10 &&
        category.menIncreaseCount &&
        category.womenIncreaseCount
      )
    ) {
      return false;
    }

    return true;
  }

  public computeGroup(categoryId: CSP.Enum): Result {
    const weightedGap = this.calculateWeightedGap(categoryId);
    return this.getResult(weightedGap);
  }

  private calculateWeightedGap(id: CSP.Enum): number {
    let group: CountAndAverageIncreases;
    if (this.groupWeightedGaps.has(id)) {
      group = this.groupWeightedGaps.get(id)!;
    }

    if (!this.increases) {
      throw new Error("increases must be set before calling canComputeGroup");
    }

    group = this.increases[id] ?? {
      menCount: 0,
      menIncreaseCount: 0,
      womenCount: 0,
      womenIncreaseCount: 0,
    };

    const gap = group.menIncreaseCount - group.womenIncreaseCount; // in full percentage (e.g. 100%)

    const groupCount = group.menCount + group.womenCount;
    const { totalGroupCount } = this.getTotalMetadata();
    return (gap * groupCount) / totalGroupCount;
  }

  private getResult(weightedGap: number): Result {
    const sign = Math.sign(weightedGap);
    const result = Math.round(Math.abs(weightedGap) * 10) / 10;

    return {
      genderAdvantage: sign === 0 ? "equality" : sign === 1 ? "men" : "women",
      note: IndicateurDeuxComputer.computeNote(result),
      result,
      resultRaw: weightedGap,
    };
  }
}
