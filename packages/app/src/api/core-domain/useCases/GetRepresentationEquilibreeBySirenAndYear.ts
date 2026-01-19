import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { representationEquilibreeMap } from "@common/core-domain/mappers/representationEquilibreeMap";
import { AppError, type UseCase } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { config } from "@common/config";

import { type IRepresentationEquilibreeRepo } from "../repo/IRepresentationEquilibreeRepo";

interface Input {
  siren: string;
  year: number;
}

export class GetRepresentationEquilibreeBySirenAndYear implements UseCase<
  Input,
  RepresentationEquilibreeDTO | null
> {
  constructor(
    private readonly representationEquilibreeRepo: IRepresentationEquilibreeRepo,
  ) {}

  public async execute({
    siren,
    year,
  }: Input): Promise<RepresentationEquilibreeDTO | null> {
    try {
      const validatedSiren = new Siren(siren);
      const validatedYear = new PositiveNumber(year);
      const representationEquilibree =
        await this.representationEquilibreeRepo.getOne([
          validatedSiren,
          validatedYear,
        ]);
      return representationEquilibree
        ? representationEquilibreeMap.toDTO(representationEquilibree)
        : null;
    } catch (error: unknown) {
      throw new GetRepresentationEquilibreeBySirenAndYearError(
        "Cannot get desired representation equilibree",
        error as Error,
      );
    }
  }
}

export class GetRepresentationEquilibreeBySirenAndYearError extends AppError {}
