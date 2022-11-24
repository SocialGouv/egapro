import { reprensentationEquilibreeMap } from "@common/core-domain/mappers/reprensentationEquilibreeMap";
import _ from "lodash";

import { sql } from "../postgres";
import { getRandomDeclarationRepEq } from "./utils";

export const seed = async function () {
  const table = "representation_equilibree";
  await sql`delete from ${sql(table)}`;

  const randomDatas = new Array(_.random(50))
    .fill(null)
    .map(() => reprensentationEquilibreeMap.toPersistence(getRandomDeclarationRepEq()));

  await sql`insert into ${sql(table)} ${sql(randomDatas)}`;
};
