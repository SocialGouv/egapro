import type { ReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { referentMap } from "@common/core-domain/mappers/referentMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";

import type { IReferentRepo } from "../../repo/IReferentRepo";

export class GetReferents implements UseCase<never, ReferentDTO[]> {
  constructor(private readonly referentRepo: IReferentRepo) {}

  public async execute(): Promise<ReferentDTO[]> {
    try {
      return (await this.referentRepo.getAll()).map(referentMap.toDTO);
    } catch (error: unknown) {
      console.error(error);
      throw new GetReferentsError("Cannot get referents", error as Error);
    }
  }
}

export class GetReferentsError extends AppError {}
