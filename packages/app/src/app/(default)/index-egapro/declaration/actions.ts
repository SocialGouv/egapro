"use server";

import { globalMailerService } from "@api/core-domain/infra/mail";
import { entrepriseService } from "@api/core-domain/infra/services";
import { declarationRepo } from "@api/core-domain/repo";
import { GetDeclarationBySirenAndYear } from "@api/core-domain/useCases/GetDeclarationBySirenAndYear";
import { SaveDeclaration } from "@api/core-domain/useCases/SaveDeclaration";
import { SendDeclarationReceipt } from "@api/core-domain/useCases/SendDeclarationReceipt";
import { jsxPdfService } from "@api/shared-domain/infra/pdf";
import { assertServerSession } from "@api/utils/auth";
import { DeclarationSpecificationError } from "@common/core-domain/domain/specification/DeclarationSpecification";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { ValidationError } from "@common/shared-domain";
import { type ServerActionResponse } from "@common/utils/next";
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

// export async function saveDeclaration(declaration: CreateDeclarationDTO): Promise<UseCaseResult> {
export async function saveDeclaration(
  declaration: CreateDeclarationDTO,
): Promise<ServerActionResponse<undefined, string>> {
  await assertServerSession({
    owner: {
      check: declaration.commencer?.siren || "",
      message: "Not authorized to save declaration for this Siren.",
    },
    staff: true,
  });

  const siren = declaration.commencer?.siren;
  const year = declaration.commencer?.annéeIndicateurs;
  const email = declaration.declarant?.email;

  try {
    const useCase = new SaveDeclaration(declarationRepo, entrepriseService);
    await useCase.execute({ declaration });

    const receiptUseCase = new SendDeclarationReceipt(declarationRepo, globalMailerService, jsxPdfService);

    assert(siren, "Siren is required");
    assert(year, "Year is required");
    assert(email, "Email is required");

    await receiptUseCase.execute({
      siren,
      year,
      email,
    });

    // Note: [revalidatePath bug](https://github.com/vercel/next.js/issues/49387). Try to reactivate it when it will be fixed in Next (it seems to be fixed in Next 14).
    // revalidatePath(`/index-egapro/declaration/${siren}/${year}`);
    // revalidatePath(`/index-egapro/declaration/${siren}/${year}/pdf`);

    return {
      ok: true,
    };
  } catch (error: unknown) {
    if (error instanceof DeclarationSpecificationError || error instanceof ValidationError) {
      return {
        ok: false,
        error: error.message ?? error.previousError,
      };
    }
    return {
      ok: false,
      error: "Une erreur est survenue, veuillez réessayer.",
    };
  }
}

export async function sendDeclarationReceipt(siren: string, year: number) {
  const session = await assertServerSession({
    owner: {
      check: siren,
      message: "Not authorized to send declaration receipt for this Siren.",
    },
    staff: true,
  });

  const useCase = new SendDeclarationReceipt(declarationRepo, globalMailerService, jsxPdfService);

  await useCase.execute({ siren, year, email: session.user.email });
}
