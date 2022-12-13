import type { OwnershipRequestRaw } from "@api/core-domain/infra/db/raw";
import type { Mapper } from "@common/shared-domain";
import { Email, UniqueID } from "@common/shared-domain/domain/valueObjects";
import type { Objectize } from "@common/utils/types";

import { OwnershipRequest } from "../domain/OwnershipRequest";
import { OwnershipRequestStatus } from "../domain/valueObjects/ownership_request/OwnershipRequestStatus";
import { Siren } from "../domain/valueObjects/Siren";
import type { OwnershipRequestSelectDTO } from "../dtos/OwnershipRequestDTO";

export const ownershipRequestMap: Required<Mapper<OwnershipRequest, OwnershipRequestSelectDTO, OwnershipRequestRaw>> = {
  toDomain(raw) {
    return new OwnershipRequest({
      id: new UniqueID(raw.id),
      createdAt: new Date(raw.created_at),
      modifiedAt: new Date(raw.modified_at),
      siren: new Siren(raw.siren),
      askerEmail: new Email(raw.asker_email),
      email: new Email(raw.email),
      status: new OwnershipRequestStatus(raw.status),
      errorDetail: raw.error_detail,
    });
  },

  toDTO(obj) {
    return {
      id: obj.id!.getValue(), // We always want to build a DTO from a complete model, so we can be sure to have id, createdAt and modifiedAt.
      askerEmail: obj.askerEmail.getValue(),
      modifiedAt: obj.modifiedAt!.toISOString(), // We always want to build a DTO from a complete model, so we can be sure to have id, createdAt and modifiedAt.
      createdAt: obj.createdAt!.toISOString(), // We always want to build a DTO from a complete model, so we can be sure to have id, createdAt and modifiedAt.
      email: obj.email.getValue(),
      siren: obj.siren.getValue(),
      status: obj.status.getValue(),
    };
  },

  toPersistence(obj) {
    return {
      siren: obj.siren.getValue(),
      asker_email: obj.askerEmail.getValue(),
      email: obj.email.getValue(),
      status: obj.status.getValue(),
    } as Objectize<OwnershipRequestRaw>;
  },
};
