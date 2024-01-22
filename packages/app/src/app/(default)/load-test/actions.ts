import { declarationRepo, representationEquilibreeRepo } from "@api/core-domain/repo";
import { GetAllDeclarationsBySiren } from "@api/core-domain/useCases/GetAllDeclarationsBySiren";
import { GetDeclarationOpmcBySirenAndYear } from "@api/core-domain/useCases/GetDeclarationOpmcBySirenAndYear";
import { GetRepresentationEquilibreeBySiren } from "@api/core-domain/useCases/GetRepresentationEquilibreeBySiren";

export async function getAllDeclarationsBySiren(siren: string) {
  // handle default errors
  const useCase = new GetAllDeclarationsBySiren(declarationRepo);
  return await useCase.execute({ siren });
}

export async function getAllRepresentationEquilibreeBySiren(siren: string) {
  // handle default errors
  const useCase = new GetRepresentationEquilibreeBySiren(representationEquilibreeRepo);
  return await useCase.execute({ siren });
}

export async function getAllDeclarationOpmcSirenAndYear(siren: string, year: number) {
  // handle default errors
  const useCase = new GetDeclarationOpmcBySirenAndYear(declarationRepo);
  return await useCase.execute({ siren, year });
}
