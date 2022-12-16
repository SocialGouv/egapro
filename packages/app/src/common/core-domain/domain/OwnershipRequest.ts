import { Entity } from "@common/shared-domain";
import type { Email, UniqueID } from "@common/shared-domain/domain/valueObjects";

import type { ErrorDetailTuple } from "./ErrorDetailTuple";
import { OwnershipRequestStatus } from "./valueObjects/ownership_request/OwnershipRequestStatus";
import type { Siren } from "./valueObjects/Siren";

export interface OwnershipRequestProps {
  askerEmail: Email;
  createdAt?: Date;
  email?: Email;
  errorDetail?: ErrorDetailTuple;
  modifiedAt?: Date;
  siren?: Siren;
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

  get shouldBeProcessed() {
    return this.status.getValue() === OwnershipRequestStatus.Enum.TO_PROCESS;
  }

  get isProcessed() {
    return this.status.getValue() === OwnershipRequestStatus.Enum.PROCESSED;
  }

  get ownershipRequested() {
    return [this.email?.getValue() ?? "", this.siren?.getValue() ?? ""] as [email: string, siren: string];
  }

  public changeStatus(newStatus: OwnershipRequestStatus.Enum) {
    this.props.status = new OwnershipRequestStatus(newStatus);
  }
}
