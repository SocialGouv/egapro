import { type Ownership } from "@common/core-domain/domain/Ownership";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type BulkRepo } from "@common/shared-domain";
import { type Email } from "@common/shared-domain/domain/valueObjects";

export interface IOwnershipRepo extends BulkRepo<Ownership> {
  addSirens(email: Email, sirensToAdd: string[], username?: string): Promise<void>;
  // Override methods from BulkRepo to add username parameter
  getAll(username?: string): Promise<Ownership[]>;
  getAllEmailsBySiren(siren: Siren, username?: string): Promise<string[]>;
  getAllSirenByEmail(email: Email, username?: string): Promise<string[]>;

  removeSirens(email: Email, sirensToRemove: string[], username?: string): Promise<void>;
}
