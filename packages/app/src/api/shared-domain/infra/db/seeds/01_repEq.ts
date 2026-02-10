import { db } from "../drizzle";
import { representationEquilibree } from "../schema";

export const seed = async function () {
  await db.delete(representationEquilibree);

  // const randomDatas = new Array(random(50))
  //   .fill(null)
  //   .map(() => representationEquilibreeMap.toPersistence(getRandomDeclarationRepEq()));

  // await sql`insert into ${sql(table)} ${sql(randomDatas)}`;
};
