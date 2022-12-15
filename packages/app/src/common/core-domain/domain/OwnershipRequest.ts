import { Entity } from "@common/shared-domain";
import type { Email, UniqueID } from "@common/shared-domain/domain/valueObjects";

import { OwnershipRequestStatus } from "./valueObjects/ownership_request/OwnershipRequestStatus";
import type { Siren } from "./valueObjects/Siren";

export interface OwnershipRequestProps {
  askerEmail: Email;
  createdAt?: Date;
  email: Email;
  errorDetail?: string;
  id?: UniqueID;
  modifiedAt?: Date;
  siren: Siren;
  status: OwnershipRequestStatus;
}

export class OwnershipRequest extends Entity<OwnershipRequestProps, UniqueID> {
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get modifiedAt(): Date | undefined {
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

  get shouldBeProcessed() {
    return this.props.status.getValue() === OwnershipRequestStatus.Enum.TO_PROCESS;
  }

  get isProcessed() {
    return this.props.status.getValue() === OwnershipRequestStatus.Enum.PROCESSED;
  }
}
