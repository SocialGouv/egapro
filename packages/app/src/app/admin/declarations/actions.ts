"use server";

import { adminDeclarationRepo, declarationRepo, representationEquilibreeRepo } from "@api/core-domain/repo";
import { type AdminDeclarationSearchCriteria } from "@api/core-domain/repo/IAdminDeclarationRepo";
import { assertServerSession } from "@api/utils/auth";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type AdminDeclarationDTO } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { type ServerActionResponse } from "@common/utils/next";
import { partition } from "lodash";

import { AdminDeclarationErrorCodes } from "./errorCodes";

export async function getAllAdminDeclarations(
  searchParams: AdminDeclarationSearchCriteria,
): Promise<ServerActionResponse<AdminDeclarationDTO[], AdminDeclarationErrorCodes>> {
  const defaultSearchParams: AdminDeclarationSearchCriteria = {
    limit: 100,
    offset: 0,
  };
  try {
    await assertServerSession({ staff: true });

    const declarations = await adminDeclarationRepo.search({
      ...defaultSearchParams,
      ...searchParams,
    });

    return {
      data: declarations,
      ok: true,
    };
  } catch (error: unknown) {
    console.warn(error);
    return {
      ok: false,
      error: AdminDeclarationErrorCodes.UNKNOWN,
    };
  }
}

export async function deleteAdminDeclarations(
  decla: AdminDeclarationDTO[],
): Promise<ServerActionResponse<void, AdminDeclarationErrorCodes>> {
  try {
    await assertServerSession({ staff: true });

    const [declaIndex, declaRepeq] = partition(decla, d => d.type === "index");

    // TODO: use a transaction if needed
    for (const d of declaIndex) {
      await declarationRepo.delete([new Siren(d.siren), new PositiveNumber(d.year)]);
    }
    for (const d of declaRepeq) {
      await representationEquilibreeRepo.delete([new Siren(d.siren), new PositiveNumber(d.year)]);
    }
    return {
      ok: true,
    };
  } catch (error: unknown) {
    console.warn(error);
    return {
      ok: false,
      error: AdminDeclarationErrorCodes.UNKNOWN,
    };
  }
}
