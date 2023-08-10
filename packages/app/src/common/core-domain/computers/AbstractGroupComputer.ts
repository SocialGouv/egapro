import { type Any } from "@common/utils/types";

import { AbstractComputer, type ComputedResult } from "./AbstractComputer";

export interface TotalMetadata<GroupKey extends string = string, AdditionalMetadata extends object = object> {
  additionalMetadata: AdditionalMetadata;
  totalEmployeeCount: number;
  totalGroupCount: number;
  totalMenCount: number;
  totalWomenCount: number;
  validGroups: GroupKey[];
}

export interface DefaultGroup {
  menCount: number;
  womenCount: number;
}

type InferGroupKey<T> = Required<T> extends Record<infer K extends string, Any> ? K : never;
type InferGroup<T> = Required<T> extends Record<string, infer G extends DefaultGroup> ? G : never;

export abstract class AbstractGroupComputer<
  Input extends Partial<Record<string, DefaultGroup>>,
  AdditionalMetadata extends object = object,
  Group extends DefaultGroup = InferGroup<Input>,
  GroupKey extends string = InferGroupKey<Input>,
  ExtendedTotalMetadata extends TotalMetadata<GroupKey, AdditionalMetadata> = TotalMetadata<
    GroupKey,
    AdditionalMetadata
  >,
> extends AbstractComputer<Input> {
  protected totalMetadata?: ExtendedTotalMetadata;
  protected groupWeightedGaps: Map<GroupKey, Group> = new Map();
  public abstract GROUP_COUNT_THRESHOLD: number;
  public abstract VALID_GROUPS_THRESHOLD: number;

  public setInput(input: Input) {
    super.setInput(input);
    delete this.totalMetadata;
    this.groupWeightedGaps.clear();
  }

  public getTotalMetadata(): ExtendedTotalMetadata {
    if (this.totalMetadata) {
      return this.totalMetadata;
    }

    if (!this.input) {
      throw new Error("input must be set before calling totalMetadata");
    }

    let totalEmployeeCount = 0;
    let totalWomenCount = 0;
    let totalMenCount = 0;
    let totalGroupCount = 0;
    const validGroups: ExtendedTotalMetadata["validGroups"] = [];
    const additionalMetadata = {} as AdditionalMetadata;

    for (const [categoryId, category] of Object.entries(this.input) as Array<[GroupKey, Group]>) {
      const womenCount = category.womenCount || 0;
      const menCount = category.menCount || 0;
      totalEmployeeCount += menCount + womenCount;
      totalWomenCount += womenCount;
      totalMenCount += menCount;

      this.addAdditionalMetadata?.(category, {
        additionalMetadata,
        totalEmployeeCount,
        totalGroupCount,
        totalMenCount,
        totalWomenCount,
        validGroups,
      } as ExtendedTotalMetadata);

      // Exclure les groupes qui n'ont pas au moins (this.GROUP_COUNT_THRESHOLD) hommes et (this.GROUP_COUNT_THRESHOLD) femmes. (e.g. 3 pour l'indicateur 1, 10 pour les indicateurs 2 ou 3)
      if (category.menCount >= this.GROUP_COUNT_THRESHOLD && category.womenCount >= this.GROUP_COUNT_THRESHOLD) {
        validGroups.push(categoryId as GroupKey);
        totalGroupCount += menCount + womenCount;
      }
    }

    return {
      totalEmployeeCount,
      totalGroupCount,
      validGroups,
      totalMenCount,
      totalWomenCount,
      additionalMetadata,
    } as ExtendedTotalMetadata;
  }

  protected addAdditionalMetadata(_category: Group, _currentMetadata: ExtendedTotalMetadata): void {
    // noop
  }

  /**
   * Vérifie si l'indicateur peut être calculé.
   */
  public canCompute(): boolean {
    if (!this.input) {
      return false;
    }

    const { totalEmployeeCount, totalGroupCount } = this.getTotalMetadata();

    return totalGroupCount / totalEmployeeCount >= this.VALID_GROUPS_THRESHOLD;
  }

  /**
   * Calcule l'indicateur.
   *
   * @returns Le résultat, avec la note et l'avantage de genre.
   */
  public compute(): ComputedResult {
    if (this.computed) {
      return this.computed;
    }

    let totalWeightedGap = 0;
    const { validGroups } = this.getTotalMetadata();
    for (const groupKey of validGroups) {
      const weightedGap = this.calculateWeightedGap(groupKey);
      totalWeightedGap += weightedGap;
    }

    this.computed = this.getResult(totalWeightedGap);
    return this.computed;
  }

  public abstract canComputeGroup(key: GroupKey): boolean;
  public computeGroup(key: GroupKey): ComputedResult {
    const weightedGap = this.calculateWeightedGap(key);
    return this.getResult(weightedGap);
  }

  protected abstract calculateWeightedGap(key: GroupKey): number;

  protected getResult(weightedGap: number): ComputedResult {
    const sign = Math.sign(weightedGap);
    const result = Math.round(Math.abs(weightedGap) * 10) / 10;

    return {
      genderAdvantage: sign === 0 ? "equality" : sign === 1 ? "men" : "women",
      note: this.computeNote(result),
      result,
      resultRaw: weightedGap,
    };
  }
}
