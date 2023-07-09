"use server";

import { referentRepo } from "@api/core-domain/repo";
import { ImportReferents } from "@api/core-domain/useCases/referent/ImportReferents";
import { assertServerSession } from "@api/utils/auth";
import { UnexpectedError } from "@common/shared-domain";
import { revalidatePath } from "next/cache";

export const importFile = async (formData: FormData) => {
  await assertServerSession({ staff: true });

  const entry = formData.get("file");
  if (!entry) {
    throw new UnexpectedError("Import require a file.");
  }

  const content = await (entry as File).text();
  const referents = JSON.parse(content);

  const useCase = new ImportReferents(referentRepo);

  try {
    await useCase.execute(referents);
    revalidatePath("/api/public/referents_egalite_professionnelle/[ext]");
  } catch (error: unknown) {
    console.error(error);
    throw new UnexpectedError("Cannot import referents");
  }
};
