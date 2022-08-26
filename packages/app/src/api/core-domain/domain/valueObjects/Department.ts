import { DEPARTMENTS } from "../../../../common/dict";
import { EnumString } from "../../../../common/shared-domain/domain/valueObjects/EnumString";
import { Object } from "../../../../common/utils/overload";

const DEPARTMENT_KEYS = Object.keys(DEPARTMENTS);

export class Department extends EnumString {
  constructor(value: string) {
    super(value, DEPARTMENT_KEYS);
  }
}
