import { NAF } from "@common/dict";
import { TupleString } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";
import type { UnknownMapping } from "@common/utils/types";

const NAF_KEYS = Object.keys(NAF);

type Naf = (typeof NAF_KEYS)[number] | UnknownMapping;

export class NafCode extends TupleString<typeof NAF_KEYS> {
  constructor(value: Naf) {
    super(value, NAF_KEYS);
  }
}
