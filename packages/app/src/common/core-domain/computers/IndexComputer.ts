import { type CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";
import { AbstractComputer, type ComputedResult } from "./AbstractComputer";
import { type IndicateurCinqComputer } from "./IndicateurCinqComputer";
import { type IndicateurDeuxComputer } from "./IndicateurDeuxComputer";
import { type IndicateurDeuxTroisComputer } from "./IndicateurDeuxTroisComputer";
import { type IndicateurQuatreComputer } from "./IndicateurQuatreComputer";
import { type IndicateurTroisComputer } from "./IndicateurTroisComputer";
import { type IndicateurUnComputer } from "./IndicateurUnComputer";

type IndicateursMoreThan250 = [
  computer1: IndicateurUnComputer | null,
  computer2: IndicateurDeuxComputer | null,
  computer3: IndicateurTroisComputer | null,
  computer4: IndicateurQuatreComputer | null,
  computer5: IndicateurCinqComputer | null,
];
type IndicateursLessThan250 = [
  computer1: IndicateurUnComputer | null,
  computer23: IndicateurDeuxTroisComputer | null,
  computer4: IndicateurQuatreComputer | null,
  computer5: IndicateurCinqComputer | null,
];

export class IndexComputer<TWorkforceRange extends CompanyWorkforceRange.Enum> extends AbstractComputer {
  public NOTE_TABLE = [];
  private indicateurs: Array<AbstractComputer | null>;

  constructor(
    private workforceRange: TWorkforceRange,
    indicateurs: TWorkforceRange extends CompanyWorkforceRange.Enum.FROM_50_TO_250
      ? IndicateursLessThan250
      : IndicateursMoreThan250,
  ) {
    super();
    this.indicateurs = indicateurs;
  }

  public compute(): ComputedResult {
    const totalNote = this.indicateurs.reduce((acc, computer) => {
      if (computer?.canCompute()) {
        return acc + computer.compute().note;
      }

      return acc;
    }, 0);

    const maxPossibleNote = this.getMaxPossibleNote();

    const result = (totalNote * 100) / maxPossibleNote;

    return {
      genderAdvantage: "equality",
      resultRaw: totalNote,
      result,
      note: Math.round(result),
    };
  }

  public canCompute(): boolean {
    return this.getMaxPossibleNote() >= 75;
  }

  public getMaxPossibleNote(): number {
    return this.indicateurs.reduce((acc, computer) => {
      if (computer?.canCompute()) {
        return acc + computer.getMaxNote();
      }

      return acc;
    }, 0);
  }
}
