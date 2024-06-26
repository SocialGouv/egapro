"use server";

import { authConfig } from "@api/core-domain/infra/auth/config";
import { globalMailerService } from "@api/core-domain/infra/mail";
import { declarationRepo, referentRepo } from "@api/core-domain/repo";
import { GetDeclarationOpmcBySirenAndYear } from "@api/core-domain/useCases/GetDeclarationOpmcBySirenAndYear";
import { SendOpmcReceipt } from "@api/core-domain/useCases/SendOpmcReceipt";
import { UpdateDeclarationWithOpMc } from "@api/core-domain/useCases/UpdateDeclarationWithOpMc";
import { jsxPdfService } from "@api/shared-domain/infra/pdf";
import { assertServerSession } from "@api/utils/auth";
import { DeclarationSpecificationError } from "@common/core-domain/domain/specification/DeclarationSpecification";
import { type UpdateOpMcDTO } from "@common/core-domain/dtos/UpdateOpMcDTO";
import { type ServerActionResponse } from "@common/utils/next";
import assert from "assert";
import { getServerSession } from "next-auth";

export async function getDeclarationOpmc(siren: string, year: number) {
  await assertServerSession({
    owner: {
      check: siren,
      message: "Not authorized to fetch declaration for this siren.",
    },
    staff: true,
  });

  // handle default errors
  const useCase = new GetDeclarationOpmcBySirenAndYear(declarationRepo);
  const declaration = await useCase.execute({ siren, year });

  return declaration;
}

type UpdateDeclarationOpmcInput = {
  opmc: UpdateOpMcDTO;
  siren: string;
  year: number;
};

export async function updateDeclarationOpmc({
  opmc,
  siren,
  year,
}: UpdateDeclarationOpmcInput): Promise<ServerActionResponse<undefined, string>> {
  await assertServerSession({
    owner: {
      check: siren || "",
      message: "Not authorized to save declaration for this Siren.",
    },
    staff: true,
  });

  const session = await getServerSession(authConfig);
  const email = session?.user.email;

  try {
    const useCase = new UpdateDeclarationWithOpMc(declarationRepo);
    await useCase.execute({ opmc, siren, year });

    const receiptUseCase = new SendOpmcReceipt(declarationRepo, referentRepo, globalMailerService, jsxPdfService);

    assert(siren, "Siren is required");
    assert(year, "Year is required");
    assert(email, "Email is required");

    await receiptUseCase.execute({
      siren,
      year,
      email,
    });

    // Note: [revalidatePath bug](https://github.com/vercel/next.js/issues/49387). Try to reactivate it when it will be fixed in Next (it seems to be fixed in Next 14).
    // revalidatePath(`/index-egapro/declaration/${siren}/${year}/pdf`);

    return {
      ok: true,
    };
  } catch (error: unknown) {
    console.error(error);

    if (error instanceof DeclarationSpecificationError) {
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
