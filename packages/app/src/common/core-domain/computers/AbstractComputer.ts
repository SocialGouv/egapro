import { type Any } from "@common/utils/types";

export interface ComputedResult {
  genderAdvantage: "equality" | "men" | "women";
  note: number;
  result: number;
  resultRaw: number;
}

export abstract class AbstractComputer<Input = Any> {
  public abstract NOTE_TABLE: number[];
  protected input?: Input;
  protected computed?: ComputedResult;

  public setInput(input: Input) {
    this.input = input;
    delete this.computed;
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

  public abstract compute(): ComputedResult;
  public abstract canCompute(): boolean;
}
