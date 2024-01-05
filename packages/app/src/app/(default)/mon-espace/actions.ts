import { declarationRepo, representationEquilibreeRepo } from "@api/core-domain/repo";
import { GetAllDeclarationsBySiren } from "@api/core-domain/useCases/GetAllDeclarationsBySiren";
import { GetDeclarationOpmcBySirenAndYear } from "@api/core-domain/useCases/GetDeclarationOpmcBySirenAndYear";
import { GetRepresentationEquilibreeBySiren } from "@api/core-domain/useCases/GetRepresentationEquilibreeBySiren";
import { assertServerSession } from "@api/utils/auth";
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
