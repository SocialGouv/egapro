import { Enum } from "@common/shared-domain/domain/valueObjects";
import type { UnknownMapping } from "@common/utils/types";

export class OwnershipRequestStatus extends Enum<typeof OwnershipRequestStatus.Enum> {
  constructor(value: Enum.ToString<typeof OwnershipRequestStatus.Enum> | OwnershipRequestStatus.Enum | UnknownMapping) {
    super(value, OwnershipRequestStatus.Enum);
  }
}
export namespace OwnershipRequestStatus {
  export enum Enum {
    ACCEPTED = "Accepté",
    ERROR = "En erreur",
    REFUSED = "Refusé",
    TO_PROCESS = "À traiter",
  }
}
