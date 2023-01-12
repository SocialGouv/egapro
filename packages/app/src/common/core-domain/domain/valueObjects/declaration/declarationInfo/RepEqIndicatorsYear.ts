import { YEARS_REPEQ } from "@common/dict";
import { TupleNumber } from "@common/shared-domain/domain/valueObjects/TupleNumber";

export class RepEqIndicatorsYear extends TupleNumber {
  constructor(value: number) {
    super(value, YEARS_REPEQ);
  }
}
