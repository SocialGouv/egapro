"use server";

import { entrepriseService } from "@api/core-domain/infra/services";
import { representationEquilibreeRepo } from "@api/core-domain/repo";
import { GetRepresentationEquilibreeBySirenAndYear } from "@api/core-domain/useCases/GetRepresentationEquilibreeBySirenAndYear";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";

export async function getRepresentationEquilibree(siren: string, year: number) {
  // handle default errors
  const useCase = new GetRepresentationEquilibreeBySirenAndYear(representationEquilibreeRepo);
  const ret = await useCase.execute({ siren, year });

  return ret;
}

export async function getCompany(siren: string) {
  return entrepriseService.siren(new Siren(siren));
}
