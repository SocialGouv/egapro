import { AbstractComputer, type ComputedResult } from "./AbstractComputer";

export interface MaternityLeaves {
  raised: number;
  total: number;
}

export class IndicateurQuatreComputer extends AbstractComputer<MaternityLeaves> {
  public NOTE_TABLE = [0, 15];
  public compute(): ComputedResult {
    if (this.computed) {
      return this.computed;
    }

    if (!this.input) {
      throw new Error("maternity leaves must be set before calling calculateWeightedGap");
    }

    let result = 0;
    if (this.input.total !== 0) {
      result = this.input.raised / this.input.total;
    }

    return {
      favorablePopulation: "women",
      note: this.computeNote(Math.floor(result)),
      result,
      resultRaw: result,
    };
  }

  public canCompute(): boolean {
    if (!this.input) {
      return false;
    }

    return typeof this.input.total === "number" && typeof this.input.raised === "number" && this.input.total > 0;
  }
}
