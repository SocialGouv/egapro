import { REGIONS } from "@common/dict";
import { TupleString } from "@common/shared-domain/domain/valueObjects";
import { Object } from "@common/utils/overload";
import type { UnknownMapping } from "@common/utils/types";

const REGION_KEYS = Object.keys(REGIONS);

type Regions = (typeof REGION_KEYS)[number] | UnknownMapping;

export class Region extends TupleString<typeof REGION_KEYS> {
  constructor(value: Regions) {
    super(value, REGION_KEYS);
  }
}
