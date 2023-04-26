import { type OwnershipRaw } from "@api/core-domain/infra/db/raw";
import { type Mapper } from "@common/shared-domain";
import { Email } from "@common/shared-domain/domain/valueObjects";

import { Ownership } from "../domain/Ownership";
import { Siren } from "../domain/valueObjects/Siren";
import { type OwnershipDTO } from "../dtos/OwnershipDTO";

export const ownershipMap: Required<Mapper<Ownership, OwnershipDTO, OwnershipRaw>> = {
  // TODO convert without validation if perf are not good
  toDomain(raw) {
    return new Ownership({
      email: new Email(raw.email),
      siren: new Siren(raw.siren),
    });
  },

  toDTO(obj) {
    return {
      email: obj.email.getValue(),
      siren: obj.siren.getValue(),
    };
  },

  toPersistence(obj) {
    return {
      email: obj.email.getValue(),
      siren: obj.siren.getValue(),
    };
  },
};
