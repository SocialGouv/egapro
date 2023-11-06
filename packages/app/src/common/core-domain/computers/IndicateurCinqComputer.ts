import { AbstractComputer, type ComputedResult } from "./AbstractComputer";

interface HighestSalaries {
  men: number;
  women: number;
}

export class IndicateurCinqComputer extends AbstractComputer<HighestSalaries> {
  public NOTE_TABLE = [0, 0, 5, 5, 10, 10];
  public compute(): ComputedResult {
    if (this.computed) {
      return this.computed;
    }

    if (!this.input) {
      throw new Error("high salaries must be set before calling calculateWeightedGap");
    }

    const min = Math.min(this.input.men, this.input.women);

    return {
      favorablePopulation:
        this.input.men > this.input.women ? "men" : this.input.women > this.input.men ? "women" : "equality",
      note: this.computeNote(min),
      result: min,
      resultRaw: min,
    };
  }

  public canCompute(): boolean {
    if (!this.input) {
      return false;
    }

    return !!this.input.men && !!this.input.women && this.input.men + this.input.women === 10;
  }
}
