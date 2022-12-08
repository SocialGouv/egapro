import type { OwnershipRequestRaw } from "@api/core-domain/infra/db/raw";
import type { Mapper } from "@common/shared-domain";
import { Email } from "@common/shared-domain/domain/valueObjects";
import type { Objectize } from "@common/utils/types";

import { OwnershipRequest } from "../domain/OwnershipRequest";
import { OwnershipRequestStatus } from "../domain/valueObjects/ownership_request/OwnershipRequestStatus";
import { Siren } from "../domain/valueObjects/Siren";
import type { OwnershipRequestDTO } from "../dtos/OwnershipRequestDTO";

export const ownershipRequestMap: Required<Mapper<OwnershipRequest, OwnershipRequestDTO | null, OwnershipRequestRaw>> =
  {
    toDomain(raw) {
      return new OwnershipRequest({
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
        askerEmail: obj.askerEmail.getValue(),
        modifiedAt: obj.modifiedAt!.toISOString(), // TODO handle multiple DTO depending on save/read/update
        createdAt: obj.createdAt!.toISOString(),
        email: obj.email.getValue(),
        siren: obj.siren.getValue(),
        status: obj.status.getValue(),
      };
    },

    toPersistence(obj) {
      return {
        created_at: obj.createdAt?.toISOString(),
        modified_at: obj.modifiedAt?.toISOString(),
        siren: obj.siren.getValue(),
        asker_email: obj.askerEmail.getValue(),
        email: obj.email.getValue(),
        status: obj.status.getValue(),
        error_detail: obj.errorDetail,
      } as Objectize<OwnershipRequestRaw>;
    },
  };
