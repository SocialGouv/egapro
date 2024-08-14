import { declarationRepo } from "@api/core-domain/repo";
import { GetAllDeclarations } from "@api/core-domain/useCases/referent/GetAllDeclarations";

export async function getAllDeclarations() {
  // handle default errors
  const useCase = new GetAllDeclarations(declarationRepo);
  return await useCase.execute();
}
