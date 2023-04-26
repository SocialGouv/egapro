import { WORKFORCES } from "@common/dict";
import { TupleString } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";
import { type UnknownMapping } from "@common/utils/types";

const WORKFORCE_KEYS = Object.keys(WORKFORCES);

type Workforces = (typeof WORKFORCE_KEYS)[number] | UnknownMapping;

export class CompanyWorkforceRange extends TupleString<typeof WORKFORCE_KEYS> {
  constructor(value: Workforces) {
    super(value, WORKFORCE_KEYS);
  }
}
