import { type IReferentRepo } from "@api/core-domain/repo/IReferentRepo";
import { type IJsxPdfService } from "@api/shared-domain/infra/pdf/IJsxPdfService";
import { config } from "@common/config";
import { ReferentType } from "@common/core-domain/domain/valueObjects/referent/ReferentType";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { AppError, type UseCase } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { type IGlobalMailerService } from "../infra/mail/IGlobalMailerService";
import { RepresentationEquilibreeReceipt } from "../infra/pdf/templates/RepresentationEquilibreeReceipt";
import { type IRepresentationEquilibreeRepo } from "../repo/IRepresentationEquilibreeRepo";

interface Input {
  email: string;
  siren: string;
  year: number;
}

export class SendRepresentationEquilibreeReceipt implements UseCase<Input, void> {
  constructor(
    private readonly representationEquilibreeRepo: IRepresentationEquilibreeRepo,
    private readonly referentRepo: IReferentRepo,
    private readonly globalMailerService: IGlobalMailerService,
    private readonly jsxPdfService: IJsxPdfService,
  ) {}

  public async execute({ siren, year, email }: Input): Promise<void> {
    try {
      const validatedSiren = new Siren(siren);
      const validatedYear = new PositiveNumber(year);
      const representationEquilibree = await this.representationEquilibreeRepo.getOne([validatedSiren, validatedYear]);

      if (!representationEquilibree) {
        throw new SendRepresentationEquilibreeReceiptNotFoundError(
          `No représentation équilibrée with siren ${siren} and year ${year}`,
        );
      }

      const referent = await this.referentRepo.getOneByCounty(representationEquilibree.company?.county);
      const buffer = await this.jsxPdfService.buffer(
        RepresentationEquilibreeReceipt({ repEq: representationEquilibree }),
      );

      const url = `${config.host}/representation-equilibree/${siren}/${year}`;
      await this.globalMailerService.init();
      const [, rejected] = await this.globalMailerService.sendMail(
        "balancedRepresentation_receipt",
        {
          to: email,
          replyTo:
            referent?.value?.getValue() && referent?.type.getValue() === ReferentType.Enum.EMAIL
              ? referent?.value?.getValue()
              : undefined,
          attachments: [
            {
              content: buffer,
              contentType: "application/pdf",
              filename: `representation_${siren}_${year + 1}.pdf`,
            },
          ],
        },
        url,
        year,
        config.host,
      );

      if (rejected.length) {
        throw new SendRepresentationEquilibreeReceiptSendError("Email was rejected");
      }
    } catch (error: unknown) {
      throw new SendRepresentationEquilibreeReceiptError(
        "Cannot send receipt for desired representation equilibree",
        error as Error,
      );
    }
  }
}

export class SendRepresentationEquilibreeReceiptError extends AppError {}
export class SendRepresentationEquilibreeReceiptNotFoundError extends AppError {}
export class SendRepresentationEquilibreeReceiptSendError extends AppError {}
