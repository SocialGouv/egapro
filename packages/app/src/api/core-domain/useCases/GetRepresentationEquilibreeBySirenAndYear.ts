import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { representationEquilibreeMap } from "@common/core-domain/mappers/representationEquilibreeMap";
import { type UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { type IRepresentationEquilibreeRepo } from "../repo/IRepresentationEquilibreeRepo";

interface Input {
  siren: string;
  year: number;
}

export class GetRepresentationEquilibreeBySirenAndYear implements UseCase<Input, RepresentationEquilibreeDTO | null> {
  constructor(private readonly reprensentationEquilibreeRepo: IRepresentationEquilibreeRepo) {}

  public async execute({ siren, year }: Input): Promise<RepresentationEquilibreeDTO | null> {
    try {
      const validatedSiren = new Siren(siren);
      const validatedYear = new PositiveNumber(year);
      const representationEquilibree = await this.reprensentationEquilibreeRepo.getOne([validatedSiren, validatedYear]);
      return representationEquilibree ? representationEquilibreeMap.toDTO(representationEquilibree) : null;
    } catch (error: unknown) {
      throw new GetRepresentationEquilibreeBySirenAndYearError(
        "Cannot desired representation equilibree",
        error as Error,
      );
    }
  }
}

export class GetRepresentationEquilibreeBySirenAndYearError extends AppError {}
