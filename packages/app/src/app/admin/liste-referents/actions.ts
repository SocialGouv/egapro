"use server";

import { referentRepo } from "@api/core-domain/repo";
import { CreateReferent } from "@api/core-domain/useCases/referent/CreateReferent";
import { DeleteReferent } from "@api/core-domain/useCases/referent/DeleteReferent";
import { EditReferent } from "@api/core-domain/useCases/referent/EditReferent";
import { assertSession } from "@api/utils/serverAction";
import {
  type CreateReferentDTO,
  createReferentDTOSchema,
  type EditReferentDTO,
  editReferentDTOSchema,
  type ReferentDTO,
} from "@common/core-domain/dtos/ReferentDTO";
import { UnexpectedError } from "@common/shared-domain";
import { revalidatePath } from "next/cache";

export async function deleteReferent(referent: ReferentDTO) {
  await assertSession({ staff: true });

  if (!referent.id) throw new UnexpectedError("Referent id is required");

  const useCase = new DeleteReferent(referentRepo);

  try {
    await useCase.execute(referent.id);
    revalidatePath("/api/public/referents_egalite_professionnelle/[ext]");
  } catch (error: unknown) {
    console.error(error);
    throw new UnexpectedError("Cannot delete referent");
  }
}

export async function createReferent(referent: CreateReferentDTO) {
  await assertSession({ staff: true });

  const useCase = new CreateReferent(referentRepo);

  try {
    const dto = createReferentDTOSchema.parse(referent);
    const id = await useCase.execute(dto);
    revalidatePath("/api/public/referents_egalite_professionnelle/[ext]");
    return id;
  } catch (error: unknown) {
    console.error(error);
    throw new UnexpectedError("Cannot create referent");
  }
}

export async function saveReferent(referent: EditReferentDTO) {
  await assertSession({ staff: true });

  const useCase = new EditReferent(referentRepo);

  try {
    const dto = editReferentDTOSchema.parse(referent);
    await useCase.execute(dto);
    revalidatePath("/api/public/referents_egalite_professionnelle/[ext]");
  } catch (error: unknown) {
    console.error(error);
    throw new UnexpectedError("Cannot save referent");
  }
}
