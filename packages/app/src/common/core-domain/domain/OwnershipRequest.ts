import { AggregateRoot } from "@common/shared-domain";
import type { Email } from "@common/shared-domain/domain/valueObjects";

import type { OwnershipRequestStatus } from "./OwnershipRequestStatus";
import type { Siren } from "./valueObjects/Siren";

export interface OwnershipRequestProps {
  askerEmail: Email;
  createdAt: Date;
  email: Email;
  errorDetail?: string;
  modifiedAt: Date;
  siren: Siren;
  status: OwnershipRequestStatus;
}

// TODO(pom): Faut-il mettre une PK fonctionnelle ou simplement le id ? Si fonctionnelle, peut être rajouter createdAt, car on n'est pas à l'abri d'avoir plusieurs demandes.
export type OwnershipRequestPK = [Siren, Email];

export class OwnershipRequest extends AggregateRoot<OwnershipRequestProps, OwnershipRequestPK> {
  get createdAt(): Date {
    return this.props.createdAt;
  }

  get modifiedAt(): Date {
    return this.props.modifiedAt;
  }

  get siren(): Siren {
    return this.props.siren;
  }

  get email(): Email {
    return this.props.email;
  }

  get askerEmail(): Email {
    return this.props.askerEmail;
  }

  get status(): OwnershipRequestStatus {
    return this.props.status;
  }

  get errorDetail(): string | undefined {
    return this.props.errorDetail;
  }
}
