import { type IJsxPdfService } from "@api/shared-domain/infra/pdf/IJsxPdfService";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { RepresentationEquilibreeReceipt } from "../infra/pdf/templates/RepresentationEquilibreeReceipt";
import { type IRepresentationEquilibreeRepo } from "../repo/IRepresentationEquilibreeRepo";

interface Input {
  siren: string;
  year: number;
}

export class DownloadRepresentationEquilibreeReceipt implements UseCase<Input, Buffer> {
  constructor(
    private readonly representationEquilibreeRepo: IRepresentationEquilibreeRepo,
    private readonly jsxPdfService: IJsxPdfService,
  ) {}

  public async execute({ siren, year }: Input): Promise<Buffer> {
    try {
      const validatedSiren = new Siren(siren);
      const validatedYear = new PositiveNumber(year);
      const representationEquilibree = await this.representationEquilibreeRepo.getOne([validatedSiren, validatedYear]);

      if (!representationEquilibree) {
        throw new DownloadRepresentationEquilibreeReceiptNotFoundError(
          `No représentation équilibrée with siren ${siren} and year ${year}`,
        );
      }

      return this.jsxPdfService.buffer(RepresentationEquilibreeReceipt({ repEq: representationEquilibree }));
    } catch (error: unknown) {
      throw new DownloadRepresentationEquilibreeReceiptError(
        "Cannot send receipt for desired representation equilibree",
        error as Error,
      );
    }
  }
}

export class DownloadRepresentationEquilibreeReceiptError extends AppError {}
export class DownloadRepresentationEquilibreeReceiptNotFoundError extends AppError {}
