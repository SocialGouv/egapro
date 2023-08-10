import { AbstractComputer, type ComputedResult as BaseComputedResult } from "./AbstractComputer";

interface RaisedCount {
  men: number;
  menCount: number;
  women: number;
  womenCount: number;
}

interface AdditionalOutput {
  equivalentEmployeeCountGap: number;
  equivalentEmployeeCountGapRaw: number;
  /**
   * Message accompagnant l'écart en nombre équivalent de salariés
   */
  ifadvantage: "equality" | "men-men" | "men-women" | "women-men" | "women-women";
  noteEquivalentEmployeeCountGap: number;
}

export namespace IndicateurDeuxTroisComputer {
  export type ComputedResult = BaseComputedResult<AdditionalOutput>;
}

export class IndicateurDeuxTroisComputer extends AbstractComputer<RaisedCount, AdditionalOutput> {
  public NOTE_TABLE = [35, 35, 35, 25, 25, 25, 15, 15, 15, 15, 15, 0];
  public compute(): IndicateurDeuxTroisComputer.ComputedResult {
    if (this.computed) {
      return this.computed;
    }

    if (!this.input) {
      throw new Error("raised count must be set before calling calculateWeightedGap");
    }

    const raiseRate = {
      women: this.input.women / this.input.womenCount,
      men: this.input.men / this.input.menCount,
    };

    const rawGap = raiseRate.men - raiseRate.women;
    const equivalentEmployeeCountGapRaw = Math.abs(rawGap) * Math.min(this.input.womenCount, this.input.menCount);
    const equivalentEmployeeCountGap = Math.round(Math.abs(equivalentEmployeeCountGapRaw) * 10) / 10;

    const sign = Math.sign(rawGap);
    const result = Math.round(Math.abs(rawGap * 100) * 10) / 10;

    let ifadvantage: AdditionalOutput["ifadvantage"] = "equality";
    if (equivalentEmployeeCountGapRaw >= 0.0005 && this.input.menCount >= this.input.womenCount) {
      ifadvantage = "men-women";
    } else if (equivalentEmployeeCountGapRaw >= 0.0005 && this.input.menCount < this.input.womenCount) {
      ifadvantage = "men-men";
    } else if (equivalentEmployeeCountGapRaw <= -0.0005 && this.input.menCount <= this.input.womenCount) {
      ifadvantage = "women-men";
    } else if (equivalentEmployeeCountGapRaw <= -0.0005 && this.input.womenCount < this.input.menCount) {
      ifadvantage = "women-women";
    }

    return {
      resultRaw: rawGap,
      result,
      equivalentEmployeeCountGap,
      equivalentEmployeeCountGapRaw,
      note: this.computeNote(result),
      genderAdvantage: sign === 0 ? "equality" : sign === 1 ? "men" : "women",
      noteEquivalentEmployeeCountGap: this.computeNote(equivalentEmployeeCountGap),
      ifadvantage,
    };
  }

  public canCompute(): boolean {
    if (!this.input) {
      return false;
    }

    return this.input.womenCount >= 5 && this.input.menCount >= 5;
  }
}
