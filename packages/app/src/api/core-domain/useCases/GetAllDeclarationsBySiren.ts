import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { declarationMap } from "@common/core-domain/mappers/declarationMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";

import type { IDeclarationRepo } from "../repo/IDeclarationRepo";

interface Input {
  siren: string;
}

export class GetAllDeclarations implements UseCase<Input, DeclarationDTO[]> {
  constructor(private readonly declarationRepo: IDeclarationRepo) {}

  public async execute({ siren }: Input): Promise<DeclarationDTO[]> {
    try {
      const validatedSiren = new Siren(siren);
      return (await this.declarationRepo.getAllBySiren(validatedSiren)).map(declarationMap.toDTO);
    } catch (error: unknown) {
      throw new GetAllDeclarationsError("Cannot get all configs", error as Error);
    }
  }
}

export class GetAllDeclarationsError extends AppError {}
