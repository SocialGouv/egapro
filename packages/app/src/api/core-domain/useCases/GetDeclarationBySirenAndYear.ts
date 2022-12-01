import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { declarationMap } from "@common/core-domain/mappers/declarationMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import type { IDeclarationRepo } from "../repo/IDeclarationRepo";

interface Input {
  siren: string;
  year: string;
}

export class GetDeclarationBySirenAndYear implements UseCase<Input, DeclarationDTO | null> {
  constructor(private readonly declarationRepo: IDeclarationRepo) {}

  public async execute({ siren, year }: Input): Promise<DeclarationDTO | null> {
    try {
      const validatedSiren = new Siren(siren);
      const validatedYear = new PositiveNumber(+year);

      const declaration = await this.declarationRepo.getOne([validatedSiren, validatedYear]);

      return declaration ? declarationMap.toDTO(declaration) : null;
    } catch (error: unknown) {
      throw new GetDeclarationBySirenAndYearError("Cannot get declaration", error as Error);
    }
  }
}

export class GetDeclarationBySirenAndYearError extends AppError {}
