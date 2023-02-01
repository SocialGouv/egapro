import { representationEquilibreeMap } from "@common/core-domain/mappers/representationEquilibreeMap";
import _ from "lodash";

import { sql } from "../postgres";
import { getRandomDeclarationRepEq } from "./utils";

export const seed = async function () {
  const table = "representation_equilibree";
  await sql`delete from ${sql(table)}`;

  const randomDatas = new Array(_.random(50))
    .fill(null)
    .map(() => representationEquilibreeMap.toPersistence(getRandomDeclarationRepEq()));

  await sql`insert into ${sql(table)} ${sql(randomDatas)}`;
};