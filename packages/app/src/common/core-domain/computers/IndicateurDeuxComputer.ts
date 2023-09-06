import { type CSP } from "../domain/valueObjects/CSP";
import { type ComputedResult as BaseComputedResult } from "./AbstractComputer";
import { AbstractGroupComputer, type DefaultGroup } from "./AbstractGroupComputer";
import { type IndicateurUnComputer } from "./IndicateurUnComputer";

interface CountAndPercentages extends DefaultGroup {
  men: number;
  women: number;
}

interface AdditionalOutput {
  remunerationsCompensated: boolean;
}

export type Percentages = Partial<Record<CSP.Enum, CountAndPercentages>>;

export namespace IndicateurDeuxComputer {
  export type ComputedResult = BaseComputedResult<AdditionalOutput>;
}

export class IndicateurDeuxComputer extends AbstractGroupComputer<Percentages, object, AdditionalOutput> {
  public NOTE_TABLE = [20, 20, 20, 10, 10, 10, 5, 5, 5, 5, 5, 0];
  public VALID_GROUPS_THRESHOLD = 0.4;
  public GROUP_COUNT_THRESHOLD = 10;

  constructor(private indicateurUnComputer: IndicateurUnComputer) {
    super();
  }

  public canComputeGroup(categoryId: CSP.Enum): boolean {
    if (!this.input) {
      return false;
    }
    const category = this.input[categoryId];

    if (!category || !(category.menCount >= 10 && category.womenCount >= 10 && category.men && category.women)) {
      return false;
    }

    return true;
  }

  protected calculateWeightedGap(id: CSP.Enum): number {
    let group: CountAndPercentages;
    if (this.groupWeightedGaps.has(id)) {
      group = this.groupWeightedGaps.get(id)!;
    }

    if (!this.input) {
      throw new Error("percentages must be set before calling calculateWeightedGap");
    }

    group = this.input[id] ?? {
      menCount: 0,
      men: 0,
      womenCount: 0,
      women: 0,
    };

    const gap = group.men - group.women; // in full percentage (e.g. 100%)

    const groupCount = group.menCount + group.womenCount;
    const { totalGroupCount } = this.getTotalMetadata();
    return (gap * groupCount) / totalGroupCount;
  }

  protected getResult(weightedGap: number): IndicateurDeuxComputer.ComputedResult {
    const result = super.getResult(weightedGap);

    const NOTE_MAX_INDICATEUR1 = this.indicateurUnComputer.getMaxNote();
    const resultIndicateurUn = this.indicateurUnComputer.compute();
    const remunerationsCompensated =
      resultIndicateurUn.note < NOTE_MAX_INDICATEUR1 && resultIndicateurUn.genderAdvantage !== result.genderAdvantage;

    return {
      ...result,
      remunerationsCompensated,
      note: remunerationsCompensated ? this.getMaxNote() : result.note,
    };
  }
}