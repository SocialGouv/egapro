import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { SimpleRepo } from "@common/shared-domain";

import type { OwnershipRaw } from "../infra/db/raw";

export interface IOwnershipRepo extends SimpleRepo {
  getAll(): Promise<OwnershipRaw[]>;
  getEmailsAllBySiren(siren: Siren): Promise<string[]>;
}
