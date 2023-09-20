"use server";

import { entrepriseService } from "@api/core-domain/infra/services";
import {
  type Entreprise,
  EntrepriseServiceClosedCompanyError,
  EntrepriseServiceNotFoundError,
} from "@api/core-domain/infra/services/IEntrepriseService";
import { declarationRepo } from "@api/core-domain/repo";
import { GetDeclarationBySirenAndYear } from "@api/core-domain/useCases/GetDeclarationBySirenAndYear";
import { SaveDeclaration } from "@api/core-domain/useCases/SaveDeclaration";
import { assertServerSession } from "@api/utils/auth";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { type ServerActionResponse } from "@common/utils/next";
import { CompanyErrorCodes } from "@globalActions/companyErrorCodes";

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

export async function getValidCompany(
  siren: string,
  year: number,
): Promise<ServerActionResponse<Entreprise, CompanyErrorCodes>> {
  try {
    const company = await entrepriseService.siren(new Siren(siren));

    const limitForClosedCompanies = new Date(year + 1, 2, 1);
    const closingDate = company.dateCessation;

    // User can't declare if company is closed before 1st of March of the next year.
    if (closingDate && new Date(closingDate) < limitForClosedCompanies) {
      throw new EntrepriseServiceClosedCompanyError("The Siren matches a closed company");
    }

    return {
      data: company,
      ok: true,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      error:
        error instanceof EntrepriseServiceNotFoundError
          ? CompanyErrorCodes.NOT_FOUND
          : error instanceof EntrepriseServiceClosedCompanyError
          ? CompanyErrorCodes.CLOSED
          : CompanyErrorCodes.UNKNOWN,
    };
  }
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

  // TODO: send receipt

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
