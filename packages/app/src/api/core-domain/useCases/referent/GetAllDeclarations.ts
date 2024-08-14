import { type DeclarationRaw } from "@api/core-domain/infra/db/DeclarationRaw";
import { type IDeclarationRepo } from "@api/core-domain/repo/IDeclarationRepo";
import { AppError, type UseCase } from "@common/shared-domain";

export class GetAllDeclarations implements UseCase<never, Array<Partial<DeclarationRaw>>> {
  constructor(private readonly declarationRepo: IDeclarationRepo) {}

  public async execute(): Promise<Array<Partial<DeclarationRaw>>> {
    try {
      return await this.declarationRepo.getAllSirenAndYear();

      // return declarations.map(declarationMap.toDTO).filter(d => d) as DeclarationDTO[];
    } catch (error: unknown) {
      throw new GetAllDeclarationsError("Cannot get all declarations", error as Error);
    }
  }
}

export class GetAllDeclarationsError extends AppError {}
