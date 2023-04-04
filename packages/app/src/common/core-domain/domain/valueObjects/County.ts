import { COUNTIES } from "@common/dict";
import { TupleString } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";
import type { UnknownMapping } from "@common/utils/types";

const COUNTIES_KEYS = Object.keys(COUNTIES);

type Counties = (typeof COUNTIES_KEYS)[number] | UnknownMapping;

export class County extends TupleString<typeof COUNTIES_KEYS> {
  constructor(value: Counties) {
    super(value, COUNTIES_KEYS);
  }
}
