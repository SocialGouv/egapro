import { type ReferentRaw } from "@api/core-domain/infra/db/raw";
import { type Mapper } from "@common/shared-domain";
import { Email, UniqueID, Url } from "@common/shared-domain/domain/valueObjects";
import { omitByRecursively } from "@common/utils/object";
import { isUndefined } from "lodash";

import { Referent } from "../domain/Referent";
import { County } from "../domain/valueObjects/County";
import { ReferentType } from "../domain/valueObjects/referent/ReferentType";
import { Region } from "../domain/valueObjects/Region";
import { type ReferentDTO } from "../dtos/ReferentDTO";

export const referentMap: Required<Mapper<Referent, ReferentDTO, ReferentRaw>> = {
  toDomain(raw) {
    const type = new ReferentType(raw.type);
    return new Referent(
      {
        name: raw.name,
        principal: raw.principal,
        type,
        value: type.getValue() === ReferentType.Enum.EMAIL ? new Email(raw.value) : new Url(raw.value),
        county: raw.county ? new County(raw.county) : void 0,
        region: new Region(raw.region),
        substitute: {
          email: raw.substitute_email ? new Email(raw.substitute_email) : void 0,
          name: raw.substitute_name ?? void 0,
        },
      },
      new UniqueID(raw.id),
    );
  },

  toDTO(obj) {
    const dto: ReferentDTO = {
      id: obj.id?.getValue() ?? "",
      name: obj.name,
      principal: obj.principal,
      region: obj.region.getValue(),
      county: obj.county?.getValue(),
      type: obj.type.getValue(),
      value: obj.value.getValue(),
      substitute: {
        email: obj.substitute?.email?.getValue(),
        name: obj.substitute?.name,
      },
    };

    return omitByRecursively(dto, isUndefined) as unknown as ReferentDTO;
  },

  toPersistence(obj) {
    return {
      id: obj.id?.getValue() ?? "",
      name: obj.name,
      principal: obj.principal,
      region: obj.region.getValue(),
      county: obj.county?.getValue() || null,
      type: obj.type.getValue(),
      value: obj.value.getValue(),
      substitute_email: obj.substitute?.email?.getValue() || null,
      substitute_name: obj.substitute?.name || null,
    };
  },
};
