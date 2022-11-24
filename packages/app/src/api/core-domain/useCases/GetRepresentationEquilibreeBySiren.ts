import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { reprensentationEquilibreeMap } from "@common/core-domain/mappers/reprensentationEquilibreeMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";

import type { IRepresentationEquilibreeRepo } from "../repo/IRepresentationEquilibreeRepo";

interface Input {
  siren: string;
}

export class GetRepresentationEquilibreeBySiren implements UseCase<Input, DeclarationDTO[]> {
  constructor(private readonly reprensentationEquilibreeRepo: IRepresentationEquilibreeRepo) {}

  public async execute({ siren }: Input): Promise<DeclarationDTO[]> {
    try {
      const validatedSiren = new Siren(siren);
      const representationEquilibrees = await this.reprensentationEquilibreeRepo.getAllBySiren(validatedSiren);
      return representationEquilibrees.map(reprensentationEquilibreeMap.toDTO).filter(d => d) as DeclarationDTO[];
    } catch (error: unknown) {
      throw new GetRepresentationEquilibreeBySirenError(
        "Cannot fetch desired representation equilibrees by given SIREN",
        error as Error,
      );
    }
  }
}

export class GetRepresentationEquilibreeBySirenError extends AppError {}
