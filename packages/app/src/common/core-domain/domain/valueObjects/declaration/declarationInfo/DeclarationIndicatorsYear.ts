import { ALL_YEARS } from "@common/dict";
import { TupleNumber } from "@common/shared-domain/domain/valueObjects/TupleNumber";

export class DeclarationIndicatorsYear extends TupleNumber {
  constructor(value: number) {
    super(value, ALL_YEARS);
  }
}
