import { type IJsxPdfService } from "@api/shared-domain/infra/pdf/IJsxPdfService";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { AppError, type UseCase } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { DeclarationReceipt } from "../infra/pdf/templates/DeclarationReceipt";
import { type IDeclarationRepo } from "../repo/IDeclarationRepo";

interface Input {
  siren: string;
  year: number;
}

export class DownloadDeclarationReceipt implements UseCase<Input, Buffer> {
  constructor(
    private readonly declarationRepo: IDeclarationRepo,
    private readonly jsxPdfService: IJsxPdfService,
  ) {}

  public async execute({ siren, year }: Input): Promise<Buffer> {
    try {
      const validatedSiren = new Siren(siren);
      const validatedYear = new PositiveNumber(year);
      const declaration = await this.declarationRepo.getOne([validatedSiren, validatedYear]);

      if (!declaration) {
        throw new DownloadDeclarationReceiptNotFoundError(`No declaration found with siren ${siren} and year ${year}`);
      }

      return this.jsxPdfService.buffer(DeclarationReceipt({ declaration }));
    } catch (error: unknown) {
      throw new DownloadDeclarationReceiptError("Cannot send receipt for desired declaration", error as Error);
    }
  }
}

export class DownloadDeclarationReceiptError extends AppError {}
export class DownloadDeclarationReceiptNotFoundError extends AppError {}
