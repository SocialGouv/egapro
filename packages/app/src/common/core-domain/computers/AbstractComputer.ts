import { type Any } from "@common/utils/types";

export type ComputedResult<Additional = object> = Additional & {
  genderAdvantage: "equality" | "men" | "women";
  note: number;
  result: number;
  resultRaw: number;
};

export abstract class AbstractComputer<Input = Any, AdditionalOutput = Any> {
  public abstract NOTE_TABLE: readonly number[];
  protected input?: Input;
  protected computed?: ComputedResult<AdditionalOutput>;

  public setInput(input: Input) {
    this.input = input;
    delete this.computed;
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
