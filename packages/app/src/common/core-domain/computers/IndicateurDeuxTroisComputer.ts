import { inRange } from "lodash";

import { AbstractComputer, type ComputedResult } from "./AbstractComputer";

interface RaisedCount {
  men: number;
  menCount: number;
  women: number;
  womenCount: number;
}

export class IndicateurDeuxTroisComputer extends AbstractComputer<RaisedCount> {
  public NOTE_TABLE = [35, 35, 35, 25, 25, 25, 15, 15, 15, 15, 15, 0];
  public compute(): ComputedResult {
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

    // abs
    // result

    return null as unknown as ComputedResult;
  }

  public canCompute(): boolean {
    if (!this.input) {
      return false;
    }

    return inRange(this.input.women, 0, this.input.womenCount) && inRange(this.input.men, 0, this.input.menCount);
  }
}
