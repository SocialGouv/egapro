import { type Ownership } from "@common/core-domain/domain/Ownership";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type BulkRepo } from "@common/shared-domain";
import { type Email } from "@common/shared-domain/domain/valueObjects";

export interface IOwnershipRepo extends BulkRepo<Ownership> {
  addSirens(email: Email, sirensToAdd: string[]): Promise<void>;
  getAllEmailsBySiren(siren: Siren): Promise<string[]>;
  getAllSirenByEmail(email: Email): Promise<string[]>;
  removeSirens(email: Email, sirensToRemove: string[]): Promise<void>;
}
