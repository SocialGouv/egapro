import { type DeclarationSearchRaw } from "@api/core-domain/infra/db/DeclarationSearch";
import { NAF } from "@common/dict";
import { AppError, type Mapper } from "@common/shared-domain";

import { type Declaration } from "../domain/Declaration";
import { extractFt } from "./declarationMap";

export const declarationSearchMap: Required<Mapper<Declaration, null, DeclarationSearchRaw>> = {
  toDomain(_raw) {
    throw new AppError("declarationSearchMap.toDomain should not be called.");
  },

  toDTO(_obj) {
    throw new AppError("declarationSearchMap.toDTO should not be called.");
  },

  toPersistence(obj) {
    return {
      declared_at: obj.declaredAt,
      departement: obj.company.county?.getValue() ?? null,
      ft: extractFt(obj),
      region: obj.company.region?.getValue() ?? null,
      section_naf: obj.company.nafCode ? NAF[obj.company.nafCode.getValue()].section.code : "",
      siren: obj.siren.getValue(),
      year: obj.year.getValue(),
      note: obj.index?.getValue() ?? null,
    };
  },
};
