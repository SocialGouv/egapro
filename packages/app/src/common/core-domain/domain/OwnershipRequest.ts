import { Entity } from "@common/shared-domain";
import type { Email, UniqueID } from "@common/shared-domain/domain/valueObjects";

import type { ErrorDetailTuple } from "./ErrorDetailTuple";
import type { OwnershipRequestStatus } from "./valueObjects/ownership_request/OwnershipRequestStatus";
import type { Siren } from "./valueObjects/Siren";

export interface OwnershipRequestProps {
  askerEmail: Email;
  createdAt?: Date;
  email?: Email | undefined;
  errorDetail?: ErrorDetailTuple | undefined;
  id?: UniqueID;
  modifiedAt?: Date;
  siren?: Siren | undefined;
  status: OwnershipRequestStatus;
}

export class OwnershipRequest extends Entity<OwnershipRequestProps, UniqueID> {
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get modifiedAt(): Date | undefined {
    return this.props.modifiedAt;
  }

  get siren(): Siren | undefined {
    return this.props.siren;
  }

  get email(): Email | undefined {
    return this.props.email;
  }

  get askerEmail(): Email {
    return this.props.askerEmail;
  }

  get status(): OwnershipRequestStatus {
    return this.props.status;
  }

  get errorDetail(): ErrorDetailTuple | undefined {
    return this.props.errorDetail;
  }
}
