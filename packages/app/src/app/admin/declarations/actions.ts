"use server";

import { adminDeclarationRepo } from "@api/core-domain/repo";
import { type AdminDeclarationSearchCriteria } from "@api/core-domain/repo/IAdminDeclarationRepo";
import { assertServerSession } from "@api/utils/auth";
import { type AdminDeclarationDTO } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { type ServerActionResponse } from "@common/utils/next";

import { AdminDeclarationErrorCodes } from "./errorCodes";

export async function getAllAdminDeclarations(
  searchParams: AdminDeclarationSearchCriteria,
): Promise<ServerActionResponse<AdminDeclarationDTO[], AdminDeclarationErrorCodes>> {
  await assertServerSession({ staff: true });

  const defaultSearchParams: AdminDeclarationSearchCriteria = {
    limit: 100,
    offset: 0,
  };
  try {
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
