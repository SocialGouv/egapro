import { declarationMap } from "@common/core-domain/mappers/declarationMap";
import type { Any } from "@common/utils/types";
import type { Knex } from "knex";
import _ from "lodash";

import { getRandomDeclarationRepEq } from "./utils";

export const seed = async function (knex: Knex) {
  await knex("representation_equilibree").del();
  await knex("representation_equilibree").insert(
    new Array(_.random(50)).fill(null).map(() => {
      const declaration = declarationMap.toPersistence(getRandomDeclarationRepEq());
      delete (declaration as Any).declarant;
      delete (declaration as Any).draft;
      delete (declaration as Any).legacy;
      return declaration;
    }),
  );
};
