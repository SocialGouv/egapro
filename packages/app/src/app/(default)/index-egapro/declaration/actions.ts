"use server";

import { globalMailerService } from "@api/core-domain/infra/mail";
import { entrepriseService } from "@api/core-domain/infra/services";
import { declarationRepo } from "@api/core-domain/repo";
import { GetDeclarationBySirenAndYear } from "@api/core-domain/useCases/GetDeclarationBySirenAndYear";
import { SaveDeclaration } from "@api/core-domain/useCases/SaveDeclaration";
import { SendDeclarationReceipt } from "@api/core-domain/useCases/SendDeclarationReceipt";
import { jsxPdfService } from "@api/shared-domain/infra/pdf";
import { assertServerSession } from "@api/utils/auth";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import assert from "assert";

export async function getDeclaration(siren: string, year: number) {
  await assertServerSession({
    owner: {
      check: siren,
      message: "Not authorized to fetch declaration for this siren.",
    },
    staff: true,
  });

  // handle default errors
  const useCase = new GetDeclarationBySirenAndYear(declarationRepo);
  const declaration = await useCase.execute({ siren, year });

  return declaration;
}

export async function saveDeclaration(declaration: CreateDeclarationDTO) {
  await assertServerSession({
    owner: {
      check: declaration.commencer?.siren || "",
      message: "Not authorized to save declaration for this siren.",
    },
    staff: true,
  });

  const useCase = new SaveDeclaration(declarationRepo, entrepriseService);
  await useCase.execute({ declaration });

  const receiptUseCase = new SendDeclarationReceipt(declarationRepo, globalMailerService, jsxPdfService);

  assert(declaration.commencer?.siren, "Siren is required");
  assert(declaration.commencer?.annéeIndicateurs, "Year is required");
  assert(declaration.declarant?.email, "Email is required");

  // TODO : error handling.

  await receiptUseCase.execute({
    siren: declaration.commencer.siren,
    year: declaration.commencer.annéeIndicateurs,
    email: declaration.declarant.email,
  });

  // revalidatePath(
  //   `/representation-equilibree/${declaration.commencer?.siren}/${declaration.commencer?.annéeIndicateurs}`,
  // );
  // revalidatePath(
  //   `/representation-equilibree/${declaration.commencer?.siren}/${declaration.commencer?.annéeIndicateurs}/pdf`,
  // );
}

// export async function sendDeclarationReceipt(siren: string, year: number) {
//   const session = await assertServerSession({
//     owner: {
//       check: siren,
//       message: "Not authorized to send declaration receipt for this siren.",
//     },
//     staff: true,
//   });

//   const useCase = new SendDeclarationReceipt(declarationRepo, globalMailerService, jsxPdfService);

//   try {
//     await useCase.execute({ siren, year, email: session.user.email });
//   } catch (e: unknown) {
//     if (e instanceof SendDeclarationReceiptError) {
//       console.log(e.appErrorStack());
//       if (e.previousError) throw e.previousError;
//     }
//     throw e;
//   }
// }
