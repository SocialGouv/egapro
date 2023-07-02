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
import { assertSession } from "@api/utils/serverAction";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CreateRepresentationEquilibreeDTO } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { revalidatePath } from "next/cache";

export async function getRepresentationEquilibree(siren: string, year: number) {
  await assertSession({
    owner: {
      check: siren,
      message: "Not authorized to fetch repeq for this siren.",
    },
    staff: true,
  });

  // handle default errors
  const useCase = new GetRepresentationEquilibreeBySirenAndYear(representationEquilibreeRepo);
  const ret = await useCase.execute({ siren, year });

  return ret;
}

export async function getCompany(siren: string) {
  return entrepriseService.siren(new Siren(siren));
}

export async function saveRepresentationEquilibree(repEq: CreateRepresentationEquilibreeDTO) {
  const session = await assertSession({
    owner: {
      check: repEq.siren,
      message: "Not authorized to save repeq for this siren.",
    },
    staff: true,
  });

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
  const session = await assertSession({
    owner: {
      check: siren,
      message: "Not authorized to send repEq receipt for this siren.",
    },
    staff: true,
  });

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
