import { YEARS } from "@common/dict";
import { EnumNumber } from "@common/shared-domain/domain/valueObjects/EnumNumber";

export class IndicatorsYear extends EnumNumber {
  constructor(value: number) {
    super(value, YEARS);
  }
}
