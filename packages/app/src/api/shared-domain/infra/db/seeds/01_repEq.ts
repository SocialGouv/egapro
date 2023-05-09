import { representationEquilibreeMap } from "@common/core-domain/mappers/representationEquilibreeMap";
import { random } from "lodash";

import { sql } from "../postgres";
import { getRandomDeclarationRepEq } from "./utils";

export const seed = async function () {
  const table = "representation_equilibree";
  await sql`delete from ${sql(table)}`;

  const randomDatas = new Array(random(50))
    .fill(null)
    .map(() => representationEquilibreeMap.toPersistence(getRandomDeclarationRepEq()));

  await sql`insert into ${sql(table)} ${sql(randomDatas)}`;
};
