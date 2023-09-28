import { type IJsxPdfService } from "@api/shared-domain/infra/pdf/IJsxPdfService";
import { config } from "@common/config";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { AppError, type UseCase } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { type IGlobalMailerService } from "../infra/mail/IGlobalMailerService";
import { DeclarationReceipt } from "../infra/pdf/templates/DeclarationReceipt";
import { type IDeclarationRepo } from "../repo/IDeclarationRepo";

interface Input {
  email: string;
  siren: string;
  year: number;
}

export class SendDeclarationReceipt implements UseCase<Input, void> {
  constructor(
    private readonly declarationRepo: IDeclarationRepo,
    private readonly globalMailerService: IGlobalMailerService,
    private readonly jsxPdfService: IJsxPdfService,
  ) {}

  public async execute({ siren, year, email }: Input): Promise<void> {
    try {
      const validatedSiren = new Siren(siren);
      const validatedYear = new PositiveNumber(year);
      const declaration = await this.declarationRepo.getOne([validatedSiren, validatedYear]);

      if (!declaration) {
        throw new SendDeclarationReceiptNotFoundError(`No declaration found with siren ${siren} and year ${year}`);
      }

      const buffer = await this.jsxPdfService.buffer(DeclarationReceipt({ declaration }));

      const url = `${config.host}/index-egapro/declaration/${siren}/${year}`;
      await this.globalMailerService.init();
      const [, rejected] = await this.globalMailerService.sendMail(
        "declaration_receipt",
        {
          to: email,
          attachments: [
            {
              content: buffer,
              contentType: "application/pdf",
              filename: `declaration_${siren}_${year + 1}.pdf`,
            },
          ],
        },
        url,
        declaration,
      );

      if (rejected.length) {
        throw new SendDeclarationReceiptSendError("Email was rejected");
      }
    } catch (error: unknown) {
      throw new SendDeclarationReceiptError(
        "Cannot send receipt for desired representation equilibree",
        error as Error,
      );
    }
  }
}

export class SendDeclarationReceiptError extends AppError {}
export class SendDeclarationReceiptNotFoundError extends AppError {}
export class SendDeclarationReceiptSendError extends AppError {}
