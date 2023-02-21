import type { ZodSizedTupleFromUnion } from "@common/utils/types";
import { z } from "zod";

import { OwnershipRequestStatus } from "../domain/valueObjects/ownership_request/OwnershipRequestStatus";

export interface OwnershipRequestDTO {
  askerEmail: string;
  createdAt: string;
  email?: string;
  errorDetail?: string;
  id: string;
  modifiedAt: string;
  name: string;
  siren?: string;
  status: OwnershipRequestStatus.Enum;
}

export type GetOwnershipRequestDTO = {
  data: OwnershipRequestDTO[];
  params: GetOwnershipRequestInputDTO;
  totalCount: number;
  warnings?: Array<readonly [string, string]>;
};

export type GetOwnershipRequestInputOrderBy = Exclude<keyof OwnershipRequestDTO, "errorDetail" | "id">;
export type GetOwnershipRequestDbOrderBy = Exclude<GetOwnershipRequestInputOrderBy, "name">;
export type GetOwnershipRequestInputDTO = z.infer<typeof getOwnershipRequestInputDTOSchema>;
export type GetOwnershipRequestInputSchemaDTO = z.input<typeof getOwnershipRequestInputDTOSchema>;

export const getOwnershipRequestInputDTOSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  orderDirection: z.union([z.literal("asc"), z.literal("desc")]).optional(),
  orderBy: z
    .union<ZodSizedTupleFromUnion<GetOwnershipRequestInputOrderBy>>([
      z.literal("askerEmail"),
      z.literal("createdAt"),
      z.literal("email"),
      z.literal("modifiedAt"),
      z.literal("siren"),
      z.literal("status"),
      z.literal("name"),
    ])
    .optional(),
  siren: z.string().optional(),
  status: z.nativeEnum(OwnershipRequestStatus.Enum).optional(),
});
