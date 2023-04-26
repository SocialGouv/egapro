import { Entity } from "@common/shared-domain";
import { type Email } from "@common/shared-domain/domain/valueObjects";

import { type Siren } from "./valueObjects/Siren";

export interface OwnershipProps {
  email: Email;
  siren: Siren;
}

export type OwnershipPK = [Siren, Email];

export class Ownership extends Entity<OwnershipProps, OwnershipPK> {
  get siren(): Siren {
    return this.props.siren;
  }

  get email(): Email {
    return this.props.email;
  }
}
