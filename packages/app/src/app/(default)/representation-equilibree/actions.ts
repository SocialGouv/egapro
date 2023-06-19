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
import { revalidatePath } from "next/cache";

export async function getRepresentationEquilibree(siren: string, year: number) {
  const session = await getServerActionSession();
  if (!session?.user) {
    throw new AppError("No session found.");
  }

  if (!session.user.companies.some(company => company.siren === siren) || !session.user.staff) {
    throw new AppError("Not authorized to fetch this siren.");
  }

  // handle default errors
  const useCase = new GetRepresentationEquilibreeBySirenAndYear(representationEquilibreeRepo);
  const ret = await useCase.execute({ siren, year });

  return ret;
}

export async function getCompany(siren: string) {
  return entrepriseService.siren(new Siren(siren));
}

export async function saveRepresentationEquilibree(repEq: CreateRepresentationEquilibreeDTO) {
  const session = await getServerActionSession();
  if (!session?.user) {
    throw new AppError("No session found.");
  }

  if (!session.user.companies.some(company => company.siren === repEq.siren) || !session.user.staff) {
    throw new AppError("Not authorized to fetch this siren.");
  }

  const useCase = new SaveRepresentationEquilibree(representationEquilibreeRepo, entrepriseService);
  await useCase.execute({ repEq, override: session.user.staff });

  const receiptUseCase = new SendRepresentationEquilibreeReceipt(
    representationEquilibreeRepo,
    globalMailerService,
    jsxPdfService,
  );

  await receiptUseCase.execute(repEq);

  revalidatePath(`/representation-equilibree/${repEq.siren}/${repEq.year}`);
  revalidatePath(`/representation-equilibree/${repEq.siren}/${repEq.year}/pdf`);
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
