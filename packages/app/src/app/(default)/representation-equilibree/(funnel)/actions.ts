"use server";

import { entrepriseService } from "@api/core-domain/infra/services";
import { representationEquilibreeRepo } from "@api/core-domain/repo";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

export async function getRepresentationEquilibree(siren: string, year: number) {
  return representationEquilibreeRepo.getOne([new Siren(siren), new PositiveNumber(year)]);
}

export async function getCompany(siren: string) {
  return entrepriseService.siren(new Siren(siren));
}
