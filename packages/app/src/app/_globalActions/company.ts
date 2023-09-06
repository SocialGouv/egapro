"use server";

import { entrepriseService } from "@api/core-domain/infra/services";
import { type Entreprise, EntrepriseServiceNotFoundError } from "@api/core-domain/infra/services/IEntrepriseService";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type ServerActionResponse } from "@common/utils/next";

import { CompanyErrorCodes } from "./companyErrorCodes";

export async function getCompany(siren: string): Promise<ServerActionResponse<Entreprise, CompanyErrorCodes>> {
  try {
    return {
      data: await entrepriseService.siren(new Siren(siren)),
      ok: true,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof EntrepriseServiceNotFoundError ? CompanyErrorCodes.NOT_FOUND : CompanyErrorCodes.UNKNOWN,
    };
  }
}
