import { type Any } from "@common/utils/types";
import { last } from "lodash";

export type ComputedResult<Additional extends object = object> = Additional & {
  favorablePopulation: "equality" | "men" | "women";
  note: number;
  result: number;
  resultRaw: number;
};

export const resultWithSign = (result: ComputedResult): number =>
  (result.favorablePopulation === "women" ? -1 : 1) * result.result;

export abstract class AbstractComputer<Input = Any, AdditionalOutput extends object = object> {
  public abstract NOTE_TABLE: readonly number[];
  protected input?: Input;
  protected computed?: ComputedResult<AdditionalOutput>;

  public setInput(input: Input) {
    this.input = input;
    delete this.computed;
  }

  public getMaxNote(): number {
    return this.NOTE_TABLE[0] === 0 ? last(this.NOTE_TABLE) ?? 0 : this.NOTE_TABLE[0];
  }

  public getInput() {
    return this.input;
  }

  /**
   * Calcule la note correspondant à l'indicateur donné.
   */
  public computeNote(result: number): number {
    const index = Math.ceil(result);

    if (index < 0 || index >= this.NOTE_TABLE.length) {
      return 0;
    }

    return this.NOTE_TABLE[index];
  }

  public abstract compute(): ComputedResult<AdditionalOutput>;
  public abstract canCompute(): boolean;
}
