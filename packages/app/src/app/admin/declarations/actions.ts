"use server";

import { declarationRepo } from "@api/core-domain/repo";
import { assertServerSession } from "@api/utils/auth";
import { type AdminDeclarationDTO } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { declarationMap } from "@common/core-domain/mappers/declarationMap";
import { type ServerActionResponse } from "@common/utils/next";

import { AdminDeclarationErrorCodes } from "./errorCodes";

export async function getAllAdminDeclarations(): Promise<
  ServerActionResponse<AdminDeclarationDTO[], AdminDeclarationErrorCodes>
> {
  await assertServerSession({ staff: true });

  try {
    const declarations = await declarationRepo.getAll();
    return {
      data: declarations.map(declarationMap.toDTO),
      ok: true,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      error: AdminDeclarationErrorCodes.UNKNOWN,
    };
  }
}
