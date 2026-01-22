import { type RepresentationEquilibreeSearchRaw } from "@api/core-domain/infra/db/raw";
import { NAF } from "@common/dict";
import { AppError, type Mapper } from "@common/shared-domain";

import { type RepresentationEquilibree } from "../domain/RepresentationEquilibree";

export const representationEquilibreeSearchMap: Required<
  Mapper<RepresentationEquilibree, null, RepresentationEquilibreeSearchRaw>
> = {
  toDomain(_raw) {
    throw new AppError("representationEquilibreeSearchMap.toDomain should not be called.");
  },

  toDTO(_obj) {
    throw new AppError("representationEquilibreeSearchMap.toDTO should not be called.");
  },

  toPersistence(obj) {
    return {
      declared_at: obj.declaredAt,
      departement: obj.company.county?.getValue() ?? null,
      ft: obj.company.name,
      region: obj.company.region?.getValue() ?? null,
      section_naf: obj.company.nafCode ? NAF[obj.company.nafCode.getValue()].section.code : "",
      siren: obj.siren.getValue(),
      year: obj.year.getValue(),
    };
  },
};
