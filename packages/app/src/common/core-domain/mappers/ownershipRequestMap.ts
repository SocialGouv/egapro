import type { OwnershipRequestRaw } from "@api/core-domain/infra/db/raw";
import type { Mapper } from "@common/shared-domain";
import { Email, UniqueID } from "@common/shared-domain/domain/valueObjects";
import type { Objectize } from "@common/utils/types";

import { OwnershipRequest } from "../domain/OwnershipRequest";
import { OwnershipRequestStatus } from "../domain/valueObjects/ownership_request/OwnershipRequestStatus";
import { Siren } from "../domain/valueObjects/Siren";
import type { OwnershipRequestDTO } from "../dtos/OwnershipRequestDTO";

export const ownershipRequestMap: Required<Mapper<OwnershipRequest, OwnershipRequestDTO, OwnershipRequestRaw>> = {
  toDomain(raw) {
    return new OwnershipRequest(
      {
        createdAt: new Date(raw.created_at),
        modifiedAt: new Date(raw.modified_at),
        siren: raw.siren !== null ? new Siren(raw.siren) : undefined,
        askerEmail: new Email(raw.asker_email),
        email: raw.email !== null ? new Email(raw.email) : undefined,
        status: new OwnershipRequestStatus(raw.status),
        errorDetail: raw.error_detail !== null ? raw.error_detail : undefined,
      },
      new UniqueID(raw.id),
    );
  },

  toDTO(obj) {
    return {
      id: obj.id!.getValue(), // We always want to build a DTO from a complete model, so we can be sure to have id, createdAt and modifiedAt.
      askerEmail: obj.askerEmail.getValue(),
      modifiedAt: obj.modifiedAt!.toISOString(), // We always want to build a DTO from a complete model, so we can be sure to have id, createdAt and modifiedAt.
      createdAt: obj.createdAt!.toISOString(), // We always want to build a DTO from a complete model, so we can be sure to have id, createdAt and modifiedAt.
      email: obj.email?.getValue(),
      siren: obj.siren?.getValue(),
      status: obj.status.getValue(),
    };
  },

  toPersistence(obj) {
    return {
      siren: obj.siren?.getValue() || null,
      asker_email: obj.askerEmail.getValue(),
      email: obj.email?.getValue() || null,
      status: obj.status.getValue(),
      error_detail: obj.errorDetail ? [obj.errorDetail.errorCode, obj.errorDetail.errorMessage] : null,
    } as Objectize<OwnershipRequestRaw>;
  },
};
