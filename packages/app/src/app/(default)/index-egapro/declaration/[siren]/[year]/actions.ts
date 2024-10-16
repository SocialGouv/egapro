"use server";
import { entrepriseService } from "@api/core-domain/infra/services";
import { declarationRepo } from "@api/core-domain/repo";
import { SaveDeclaration } from "@api/core-domain/useCases/SaveDeclaration";
import { assertServerSession } from "@api/utils/auth";
import { DeclarationSpecificationError } from "@common/core-domain/domain/specification/DeclarationSpecification";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { ValidationError } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { type ServerActionResponse } from "@common/utils/next";

export async function updateCompanyInfos(
  declaration: CreateDeclarationDTO,
  oldSiren: string | undefined,
): Promise<ServerActionResponse<undefined, string>> {
  const session = await assertServerSession({
    owner: {
      check: declaration.commencer?.siren || "",
      message: "Not authorized to save declaration for this Siren.",
    },
    staff: true,
  });

  try {
    const useCase = new SaveDeclaration(declarationRepo, entrepriseService);
    await useCase.execute({ declaration, override: session?.user?.staff });
    if (oldSiren && declaration.commencer?.annéeIndicateurs)
      await declarationRepo.delete([new Siren(oldSiren), new PositiveNumber(declaration.commencer?.annéeIndicateurs)]);

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
