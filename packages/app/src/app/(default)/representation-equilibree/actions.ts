"use server";

import { globalMailerService } from "@api/core-domain/infra/mail";
import { entrepriseService } from "@api/core-domain/infra/services";
import { EntrepriseServiceNotFoundError } from "@api/core-domain/infra/services/IEntrepriseService";
import { referentRepo, representationEquilibreeRepo } from "@api/core-domain/repo";
import { GetRepresentationEquilibreeBySirenAndYear } from "@api/core-domain/useCases/GetRepresentationEquilibreeBySirenAndYear";
import { SaveRepresentationEquilibree } from "@api/core-domain/useCases/SaveRepresentationEquilibree";
import {
  SendRepresentationEquilibreeReceipt,
  SendRepresentationEquilibreeReceiptError,
} from "@api/core-domain/useCases/SendRepresentationEquilibreeReceipt";
import { jsxPdfService } from "@api/shared-domain/infra/pdf";
import { assertServerSession } from "@api/utils/auth";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { type CreateRepresentationEquilibreeDTO } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { UnexpectedSessionError } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { type ServerActionResponse } from "@common/utils/next";

export async function getRepresentationEquilibree(siren: string, year: number) {
  await assertServerSession({
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

export async function saveRepresentationEquilibree(repEq: CreateRepresentationEquilibreeDTO) {
  const session = await assertServerSession({
    owner: {
      check: repEq.siren,
      message: "Not authorized to save repeq for this siren.",
    },
    staff: true,
  });

  const useCase = new SaveRepresentationEquilibree(representationEquilibreeRepo, entrepriseService);
  await useCase.execute({ repEq, override: session.user.staff });

  try {
    const receiptUseCase = new SendRepresentationEquilibreeReceipt(
      representationEquilibreeRepo,
      referentRepo,
      globalMailerService,
      jsxPdfService,
    );

    await receiptUseCase.execute(repEq);
  } catch (error) {
    console.error("Failed to send receipt:", error);
    // Don't fail the whole operation if receipt sending fails
  }

  // Note: [revalidatePath bug](https://github.com/vercel/next.js/issues/49387). Try to reactivate it when it will be fixed in Next (it seems to be fixed in Next 14).
  // revalidatePath(`/representation-equilibree/${repEq.siren}/${repEq.year}`);
  // revalidatePath(`/representation-equilibree/${repEq.siren}/${repEq.year}/pdf`);
}

export async function sendRepresentationEquilibreeReceipt(siren: string, year: number) {
  const session = await assertServerSession({
    owner: {
      check: siren,
      message: "Not authorized to send repEq receipt for this siren.",
    },
    staff: true,
  });

  const useCase = new SendRepresentationEquilibreeReceipt(
    representationEquilibreeRepo,
    referentRepo,
    globalMailerService,
    jsxPdfService,
  );

  try {
    await useCase.execute({ siren, year, email: session.user.email });
  } catch (e: unknown) {
    if (e instanceof SendRepresentationEquilibreeReceiptError) {
      console.error(e.appErrorStack());
      if (e.previousError) throw e.previousError;
    }
    throw e;
  }
}

/**
 * Action serveur pour mettre à jour les informations de l'entreprise dans la représentation équilibrée
 * Cette fonction met à jour directement l'objet dans la base de données
 */
export async function updateCompanyInfos(
  siren: string,
  year: number,
  updatedCompanyData: CompanyDTO,
  oldSiren?: string,
): Promise<ServerActionResponse<undefined, string>> {
  try {
    // Vérifier l'autorisation sur le nouveau SIREN
    await assertServerSession({
      owner: {
        check: siren,
        message: "Not authorized to update company infos for this Siren.",
      },
      staff: true,
    });

    // Si oldSiren est fourni (changement de SIREN), vérifier également l'autorisation sur l'ancien SIREN
    if (oldSiren && oldSiren !== siren) {
      await assertServerSession({
        owner: {
          check: oldSiren,
          message: "Not authorized to modify the original company with this Siren.",
        },
        staff: true,
      });
    }

    // Récupérer la représentation équilibrée existante
    const useCase = new GetRepresentationEquilibreeBySirenAndYear(representationEquilibreeRepo);
    const existingRepEq = await useCase.execute({ siren: oldSiren || siren, year });

    if (!existingRepEq) {
      return {
        ok: false,
        error: "Représentation équilibrée non trouvée.",
      };
    }

    // Créer une clé primaire en utilisant l'ancien SIREN (ou le SIREN original si pas de changement)
    // pour récupérer l'enregistrement existant
    const originalSiren = oldSiren || siren;
    const originalPk: [Siren, PositiveNumber] = [new Siren(originalSiren), new PositiveNumber(year)];

    // Récupérer l'objet RepresentationEquilibree depuis le repository avec la clé originale
    const repEqEntity = await representationEquilibreeRepo.getOne(originalPk);

    if (!repEqEntity) {
      return {
        ok: false,
        error: "Représentation équilibrée non trouvée dans le repository.",
      };
    }

    // Créer un nouvel objet RepresentationEquilibree avec les informations de l'entreprise mises à jour
    const updatedRepEq = repEqEntity.fromJson({
      company: {
        name: updatedCompanyData.name,
        address: updatedCompanyData.address || "",
        city: updatedCompanyData.city || "",
        postalCode: updatedCompanyData.postalCode || "",
        countryCode: updatedCompanyData.countryIsoCode,
        nafCode: updatedCompanyData.nafCode,
        county: updatedCompanyData.county,
        region: updatedCompanyData.region,
        siren: siren,
      },
      modifiedAt: new Date(),
      // Si le SIREN a été modifié, mettre à jour le SIREN dans l'entité
      ...(oldSiren && oldSiren !== siren ? { siren: siren } : {}),
    });

    // Si le SIREN a été modifié, nous devons gérer la création et la suppression de manière atomique
    if (oldSiren && oldSiren !== siren) {
      try {
        // Sauvegarder d'abord l'entité mise à jour avec le nouveau SIREN
        await representationEquilibreeRepo.saveWithIndex(updatedRepEq);

        // Puis supprimer l'ancienne représentation équilibrée avec l'ancien SIREN
        const oldPk: [Siren, PositiveNumber] = [new Siren(oldSiren), new PositiveNumber(year)];
        await representationEquilibreeRepo.delete(oldPk);
      } catch (error) {
        // En cas d'erreur lors de la suppression, essayer de supprimer la nouvelle entité
        // pour éviter les doublons
        console.error("Erreur lors de la mise à jour du SIREN:", error);
        try {
          const newPk: [Siren, PositiveNumber] = [new Siren(siren), new PositiveNumber(year)];
          await representationEquilibreeRepo.delete(newPk);
        } catch (rollbackError) {
          console.error("Erreur lors de la tentative de rollback:", rollbackError);
        }
        throw error; // Propager l'erreur originale
      }
    } else {
      // Si le SIREN n'a pas été modifié, simplement sauvegarder l'entité mise à jour
      await representationEquilibreeRepo.saveWithIndex(updatedRepEq);
    }

    return {
      ok: true,
    };
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour directe des informations de l'entreprise:", error);
    if (error instanceof UnexpectedSessionError) {
      return {
        ok: false,
        error: "Vous n'êtes pas autorisé à modifier ces informations.",
      };
    } else if (error instanceof EntrepriseServiceNotFoundError) {
      return {
        ok: false,
        error: "Représentation équilibrée non trouvée.",
      };
    } else {
      return {
        ok: false,
        error: "Une erreur est survenue lors de la mise à jour des informations de l'entreprise.",
      };
    }
  }
}
