import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type DeclarationOpmcDTO } from "@common/core-domain/dtos/DeclarationOpmcDTO";
import { declarationOpmcMap } from "@common/core-domain/mappers/declarationOpmcMap";
import { AppError, type UseCase } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { type IDeclarationRepo } from "../repo/IDeclarationRepo";

interface Input {
  siren: string;
  year: number;
}

export class GetDeclarationOpmcBySirenAndYear implements UseCase<Input, DeclarationOpmcDTO | null> {
  constructor(private readonly declarationRepo: IDeclarationRepo) {}

  public async execute({ siren, year }: Input): Promise<DeclarationOpmcDTO | null> {
    try {
      const validatedSiren = new Siren(siren);
      const validatedYear = new PositiveNumber(year);

      const declaration = await this.declarationRepo.getOneDeclarationOpmc([validatedSiren, validatedYear]);

      return declaration ? declarationOpmcMap.toDTO(declaration) : null;
    } catch (error: unknown) {
      console.error(error);
      throw new GetDeclarationOpmcBySirenAndYearError("Cannot get declaration", error as Error);
    }
  }
}

export class GetDeclarationOpmcBySirenAndYearError extends AppError {}
