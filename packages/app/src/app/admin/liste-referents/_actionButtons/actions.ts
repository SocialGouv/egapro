"use server";

import { referentRepo } from "@api/core-domain/repo";
import { ImportReferents } from "@api/core-domain/useCases/referent/ImportReferents";
import { assertSession } from "@api/utils/serverAction";
import { UnexpectedError } from "@common/shared-domain";

export const importFile = async (formData: FormData) => {
  await assertSession({ staff: true });

  const entry = formData.get("file");
  if (!entry) {
    throw new UnexpectedError("Import require a file.");
  }

  const content = await (entry as File).text();
  const referents = JSON.parse(content);

  const useCase = new ImportReferents(referentRepo);

  try {
    await useCase.execute(referents);
  } catch (error: unknown) {
    console.error(error);
    throw new UnexpectedError("Cannot import referents");
  }
};
