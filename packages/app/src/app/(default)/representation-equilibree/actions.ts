"use server";

import { globalMailerService } from "@api/core-domain/infra/mail";
import { entrepriseService } from "@api/core-domain/infra/services";
import { representationEquilibreeRepo } from "@api/core-domain/repo";
import { GetRepresentationEquilibreeBySirenAndYear } from "@api/core-domain/useCases/GetRepresentationEquilibreeBySirenAndYear";
import { SaveRepresentationEquilibree } from "@api/core-domain/useCases/SaveRepresentationEquilibree";
import {
  SendRepresentationEquilibreeReceipt,
  SendRepresentationEquilibreeReceiptError,
} from "@api/core-domain/useCases/SendRepresentationEquilibreeReceipt";
import { jsxPdfService } from "@api/shared-domain/infra/pdf";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CreateRepresentationEquilibreeDTO } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { AppError } from "@common/shared-domain";
import { getServerActionSession } from "@common/utils/next-auth";

export async function getRepresentationEquilibree(siren: string, year: number) {
  // handle default errors
  const useCase = new GetRepresentationEquilibreeBySirenAndYear(representationEquilibreeRepo);
  const ret = await useCase.execute({ siren, year });

  return ret;
}

export async function getCompany(siren: string) {
  return entrepriseService.siren(new Siren(siren));
}

export async function saveRepresentationEquilibree(repEq: CreateRepresentationEquilibreeDTO) {
  const useCase = new SaveRepresentationEquilibree(representationEquilibreeRepo, entrepriseService);
  const ret = await useCase.execute(repEq);

  return ret;
}

export async function sendRepresentationEquilibreeReceipt(siren: string, year: number) {
  const session = await getServerActionSession();
  if (!session?.user) {
    throw new AppError("No session found.");
  }
  const useCase = new SendRepresentationEquilibreeReceipt(
    representationEquilibreeRepo,
    globalMailerService,
    jsxPdfService,
  );

  try {
    await useCase.execute({ siren, year, email: session.user.email });
  } catch (e: unknown) {
    if (e instanceof SendRepresentationEquilibreeReceiptError) {
      console.log(e.appErrorStack());
      if (e.previousError) throw e.previousError;
    }
    throw e;
  }
}
