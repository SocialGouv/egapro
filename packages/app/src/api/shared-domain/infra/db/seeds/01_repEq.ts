import { sql } from "../postgres";

export const seed = async function () {
  const table = "representation_equilibree";
  await sql`delete from ${sql(table)}`;

  // const randomDatas = new Array(random(50))
  //   .fill(null)
  //   .map(() => representationEquilibreeMap.toPersistence(getRandomDeclarationRepEq()));

  // await sql`insert into ${sql(table)} ${sql(randomDatas)}`;
};
