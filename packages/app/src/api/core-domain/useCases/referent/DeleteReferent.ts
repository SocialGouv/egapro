import { AppError, type UseCase } from "@common/shared-domain";
import { UniqueID } from "@common/shared-domain/domain/valueObjects";

import { type IReferentRepo } from "../../repo/IReferentRepo";

export class DeleteReferent implements UseCase<string, void> {
  constructor(private readonly referentRepo: IReferentRepo) {}

  public async execute(id: string): Promise<void> {
    try {
      const validatedId = new UniqueID(id);
      const found = await this.referentRepo.getOne(validatedId);
      if (!found) {
        throw new DeleteReferentNotFoundError(`No referent found with id ${id}.`);
      }
      await this.referentRepo.delete(validatedId);
    } catch (error: unknown) {
      console.error(error);
      throw new DeleteReferentError("Cannot delete referent", error as Error);
    }
  }
}

export class DeleteReferentError extends AppError {}
export class DeleteReferentNotFoundError extends DeleteReferentError {}
