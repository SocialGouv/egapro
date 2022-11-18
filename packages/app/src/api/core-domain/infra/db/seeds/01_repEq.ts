import { reprensentationEquilibreeMap } from "@common/core-domain/mappers/reprensentationEquilibreeMap";
import type { Knex } from "knex";
import _ from "lodash";

import { getRandomDeclarationRepEq } from "./utils";

export const seed = async function (knex: Knex) {
  await knex("representation_equilibree").del();
  await knex("representation_equilibree").insert(
    new Array(_.random(50))
      .fill(null)
      .map(() => reprensentationEquilibreeMap.toPersistence(getRandomDeclarationRepEq())),
  );
};
