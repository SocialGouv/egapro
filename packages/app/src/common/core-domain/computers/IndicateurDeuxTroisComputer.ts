import { AbstractComputer, type ComputedResult as BaseComputedResult } from "./AbstractComputer";
import { type IndicateurUnComputer } from "./IndicateurUnComputer";

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
   * Message accompagnant l'écart en nombre équivalent de salariés.
   *
   * Exemples :
   * ```
   * "men-men":
   *   "Si ce nombre d'hommes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes.",
   * "men-women":
   *   "Si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes.",
   * "women-men":
   *   "Si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre hommes et femmes.",
   * "women-women":
   *   "Si ce nombre de femmes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre hommes et femmes.",
   * equality: "Les femmes et les hommes sont à égalité"
   * ```
   */
  ifadvantage: "equality" | "men-men" | "men-women" | "women-men" | "women-women";
  noteEquivalentEmployeeCountGap: number;
  notePercent: number;
  remunerationsCompensated: boolean;
}

export namespace IndicateurDeuxTroisComputer {
  export type ComputedResult = BaseComputedResult<AdditionalOutput>;
}

export class IndicateurDeuxTroisComputer extends AbstractComputer<RaisedCount, AdditionalOutput> {
  public NOTE_TABLE = [35, 35, 35, 25, 25, 25, 15, 15, 15, 15, 15, 0];

  constructor(private indicateurUnComputer: IndicateurUnComputer) {
    super();
  }

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

    const genderAdvantage = sign === 0 ? "equality" : sign === 1 ? "men" : "women";
    const NOTE_MAX_INDICATEUR1 = this.indicateurUnComputer.getMaxNote();
    const resultIndicateurUn = this.indicateurUnComputer.compute();
    const remunerationsCompensated =
      resultIndicateurUn.note < NOTE_MAX_INDICATEUR1 && resultIndicateurUn.genderAdvantage !== genderAdvantage;
    const notePercent = this.computeNote(result);
    const noteEquivalentEmployeeCountGap = this.computeNote(equivalentEmployeeCountGap);
    const note = Math.max(notePercent, noteEquivalentEmployeeCountGap);

    return {
      resultRaw: rawGap,
      result,
      equivalentEmployeeCountGap,
      equivalentEmployeeCountGapRaw,
      note,
      genderAdvantage,
      noteEquivalentEmployeeCountGap,
      notePercent,
      ifadvantage,
      remunerationsCompensated,
    };
  }

  public canCompute(): boolean {
    if (!this.input) {
      return false;
    }

    return this.input.womenCount >= 5 && this.input.menCount >= 5;
  }
}
