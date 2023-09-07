"use server";

import { entrepriseService } from "@api/core-domain/infra/services";
import { declarationRepo } from "@api/core-domain/repo";
import { GetDeclarationBySirenAndYear } from "@api/core-domain/useCases/GetDeclarationBySirenAndYear";
import { SaveDeclaration } from "@api/core-domain/useCases/SaveDeclaration";
import { assertServerSession } from "@api/utils/auth";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";

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
      check: declaration.entreprise.siren,
      message: "Not authorized to save declaration for this siren.",
    },
    staff: true,
  });

  const useCase = new SaveDeclaration(declarationRepo, entrepriseService);
  await useCase.execute({ declaration });

  // const receiptUseCase = new SendDeclarationReceipt(declarationRepo, globalMailerService, jsxPdfService);

  // await receiptUseCase.execute(declaration);

  // revalidatePath(`/representation-equilibree/${repEq.siren}/${repEq.year}`);
  // revalidatePath(`/representation-equilibree/${repEq.siren}/${repEq.year}/pdf`);
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
