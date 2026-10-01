"use server";

import { entrepriseService } from "@api/core-domain/infra/services";
import { type Entreprise, EntrepriseServiceNotFoundError } from "@api/core-domain/infra/services/IEntrepriseService";
import { assertServerSession } from "@api/utils/auth";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { UnexpectedSessionError } from "@common/shared-domain";
import { type ServerActionResponse } from "@common/utils/next";
import moize from "moize";

import { CompanyErrorCodes } from "./companyErrorCodes";

// Cache the result for 5 minutes. Created once per module (a moize created per call never hits),
// and keyed on the siren string (a Siren instance is a new reference on every call).
const moizedGetCompany = moize((siren: string) => entrepriseService.siren(new Siren(siren)), {
  isPromise: true,
  maxAge: 5 * 60_000,
  maxSize: 1_000,
});

export async function getCompany(siren: string): Promise<ServerActionResponse<Entreprise, CompanyErrorCodes>> {
  try {
    // Only called from authenticated pages: don't let anonymous callers use the server as a proxy to the company API.
    // An expired session is answered like any other failure: most callers only handle `ok: false`, not a rejection.
    await assertServerSession();

    return {
      data: await moizedGetCompany(new Siren(siren).getValue()),
      ok: true,
    };
  } catch (error: unknown) {
    if (!(error instanceof UnexpectedSessionError)) console.log("Error in getCompany", error);
    return {
      ok: false,
      error: error instanceof EntrepriseServiceNotFoundError ? CompanyErrorCodes.NOT_FOUND : CompanyErrorCodes.UNKNOWN,
    };
  }
}
