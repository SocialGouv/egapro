import type { ZodSizedTupleFromUnion } from "@common/utils/types";
import { z } from "zod";

import { OwnershipRequestStatus } from "../domain/valueObjects/ownership_request/OwnershipRequestStatus";

export interface OwnershipRequestDTO {
  askerEmail: string;
  createdAt: string;
  email?: string;
  id: string;
  modifiedAt: string;
  siren?: string;
  status: OwnershipRequestStatus.Enum;
}

export type GetOwnershipRequestDTO = {
  data: OwnershipRequestDTO[];
  params: GetOwnershipRequestInputDTO;
  totalCount: number;
  warnings?: Array<readonly [string, string]>;
};

export type GetOwnershipRequestInputOrderBy = Exclude<keyof OwnershipRequestDTO, "id">;
export type GetOwnershipRequestInputDTO = z.infer<typeof getOwnershipRequestInputDTOSchema>;

export const getOwnershipRequestInputDTOSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  order: z.union([z.literal("asc"), z.literal("desc")]).optional(),
  orderBy: z
    .union<ZodSizedTupleFromUnion<GetOwnershipRequestInputOrderBy>>([
      z.literal("askerEmail"),
      z.literal("createdAt"),
      z.literal("email"),
      z.literal("modifiedAt"),
      z.literal("siren"),
      z.literal("status"),
    ])
    .optional(),
  siren: z.string().optional(),
  status: z.nativeEnum(OwnershipRequestStatus.Enum).optional(),
});
