import { type IReferentRepo } from "@api/core-domain/repo/IReferentRepo";
import { type IJsxPdfService } from "@api/shared-domain/infra/pdf/IJsxPdfService";
import { ReferentType } from "@common/core-domain/domain/valueObjects/referent/ReferentType";
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

export class SendOpmcReceipt implements UseCase<Input, void> {
  constructor(
    private readonly declarationRepo: IDeclarationRepo,
    private readonly referentRepo: IReferentRepo,
    private readonly globalMailerService: IGlobalMailerService,
    private readonly jsxPdfService: IJsxPdfService,
  ) {}

  public async execute({ siren, year, email }: Input): Promise<void> {
    try {
      const validatedSiren = new Siren(siren);
      const validatedYear = new PositiveNumber(year);
      const declarationOpmc = await this.declarationRepo.getOneDeclarationOpmc([validatedSiren, validatedYear]);

      if (!declarationOpmc) {
        throw new SendOpmcReceiptNotFoundError(`No declaration found with siren ${siren} and year ${year}`);
      }

      const referent = await this.referentRepo.getOneByRegion(declarationOpmc.declaration?.company?.region);
      const buffer = await this.jsxPdfService.buffer(DeclarationReceipt(declarationOpmc));

      await this.globalMailerService.init();
      let rejected;
      if ((declarationOpmc?.declaration?.index?.getValue() || 0) < 75) {
        [, rejected] = await this.globalMailerService.sendMail("opmc_receipt", {
          to: email,
          replyTo:
            referent?.value?.getValue() && referent?.type.getValue() === ReferentType.Enum.EMAIL
              ? referent?.value?.getValue()
              : undefined,
          attachments: [
            {
              content: buffer,
              contentType: "application/pdf",
              filename: `declaration_${siren}_${year + 1}.pdf`,
            },
          ],
        });
      } else {
        [, rejected] = await this.globalMailerService.sendMail("op_receipt", {
          to: email,
          replyTo:
            referent?.value?.getValue() && referent?.type.getValue() === ReferentType.Enum.EMAIL
              ? referent?.value?.getValue()
              : undefined,
          attachments: [
            {
              content: buffer,
              contentType: "application/pdf",
              filename: `declaration_${siren}_${year + 1}.pdf`,
            },
          ],
        });
      }

      if (rejected.length) {
        throw new SendOpmcReceiptSendError("Email was rejected");
      }
    } catch (error: unknown) {
      throw new SendOpmcReceiptError("Cannot send receipt for desired declaration", error as Error);
    }
  }
}

export class SendOpmcReceiptError extends AppError {}
export class SendOpmcReceiptNotFoundError extends AppError {}
export class SendOpmcReceiptSendError extends AppError {}
