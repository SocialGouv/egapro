"use server";

import { declarationRepo, ownershipRepo, representationEquilibreeRepo } from "@api/core-domain/repo";
import { GetAllDeclarationsBySiren } from "@api/core-domain/useCases/GetAllDeclarationsBySiren";
import { GetDeclarationOpmcBySirenAndYear } from "@api/core-domain/useCases/GetDeclarationOpmcBySirenAndYear";
import { GetRepresentationEquilibreeBySiren } from "@api/core-domain/useCases/GetRepresentationEquilibreeBySiren";
import { assertServerSession } from "@api/utils/auth";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { UnexpectedSessionError } from "@common/shared-domain";
import { Email } from "@common/shared-domain/domain/valueObjects";
import assert from "assert";

export async function getAllDeclarationsBySiren(siren: string) {
  await assertServerSession({
    owner: {
      check: siren,
      message: "Not authorized to fetch declarations for this siren.",
    },
    staff: true,
  });

  assert(siren, "Siren is required");

  // handle default errors
  const useCase = new GetAllDeclarationsBySiren(declarationRepo);
  return await useCase.execute({ siren });
}

export async function getAllRepresentationEquilibreeBySiren(siren: string) {
  await assertServerSession({
    owner: {
      check: siren,
      message: "Not authorized to fetch representation equilibree for this siren.",
    },
    staff: true,
  });

  assert(siren, "Siren is required");

  // handle default errors
  const useCase = new GetRepresentationEquilibreeBySiren(representationEquilibreeRepo);
  return await useCase.execute({ siren });
}

export async function getAllDeclarationOpmcSirenAndYear(siren: string, year: number) {
  await assertServerSession({
    owner: {
      check: siren,
      message: "Not authorized to fetch representation equilibree for this siren.",
    },
    staff: true,
  });

  assert(siren, "Siren is required");
  assert(year, "Year is required");

  // handle default errors
  const useCase = new GetDeclarationOpmcBySirenAndYear(declarationRepo);
  return await useCase.execute({ siren, year });
}

export async function getAllEmailsBySiren(siren: string) {
  const session = await assertServerSession({
    owner: {
      check: siren,
      message: "Not authorized to fetch owners for this siren.",
    },
    staff: true,
  });

  return await ownershipRepo.getAllEmailsBySiren(new Siren(siren), session.user.email);
}

/**
 * A responsable may only manage the responsable list of a SIREN they already
 * own; staff may manage any SIREN. Mirrors the owner/staff guard used by the
 * read actions above.
 *
 * Without this check any authenticated account could attach itself to — or
 * detach the legitimate responsable from — an arbitrary SIREN.
 */
async function assertCanManageResponsables(sirens: string[]) {
  const session = await assertServerSession();
  if (session.user.staff) return;

  const ownsEverySiren = sirens.every(siren =>
    session.user.companies.some(company => company.siren === siren),
  );
  if (!ownsEverySiren) {
    throw new UnexpectedSessionError("Not authorized to manage responsables for this siren.");
  }
}

export async function removeSirens(email: string, sirens: string[], username?: string) {
  await assertCanManageResponsables(sirens);

  return await ownershipRepo.removeSirens(new Email(email), sirens, username || email);
}

export async function addSirens(email: string, sirens: string[], username?: string) {
  await assertCanManageResponsables(sirens);

  return await ownershipRepo.addSirens(new Email(email), sirens, username || email);
}
