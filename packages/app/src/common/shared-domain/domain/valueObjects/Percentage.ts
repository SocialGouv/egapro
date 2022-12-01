import { RangeNumber } from "./RangeNumber";

const percentageRange: RangeNumber.Range = [0, 100];
export class Percentage extends RangeNumber {
  constructor(value: number) {
    super(value, { range: percentageRange });
  }
}
