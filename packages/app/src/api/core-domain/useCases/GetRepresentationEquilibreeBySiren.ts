import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { representationEquilibreeMap } from "@common/core-domain/mappers/representationEquilibreeMap";
import { AppError, type UseCase } from "@common/shared-domain";

import { type IRepresentationEquilibreeRepo } from "../repo/IRepresentationEquilibreeRepo";

interface Input {
  siren: string;
}

export class GetRepresentationEquilibreeBySiren implements UseCase<Input, RepresentationEquilibreeDTO[]> {
  constructor(private readonly representationEquilibreeRepo: IRepresentationEquilibreeRepo) {}

  public async execute({ siren }: Input): Promise<RepresentationEquilibreeDTO[]> {
    try {
      const validatedSiren = new Siren(siren);
      const representationEquilibrees = await this.representationEquilibreeRepo.getAllBySiren(validatedSiren);
      return representationEquilibrees.map(representationEquilibreeMap.toDTO).filter(d => d);
    } catch (error: unknown) {
      throw new GetRepresentationEquilibreeBySirenError(
        "Cannot fetch desired representation equilibrees by given Siren",
        error as Error,
      );
    }
  }
}

export class GetRepresentationEquilibreeBySirenError extends AppError {}
