import type { UnknownMapping } from "@common/utils/types";

export type OwnershipRequestAction = "accept" | "reject";
export interface OwnershipRequestActionDTO {
  action: OwnershipRequestAction | UnknownMapping;
  uuids: string[];
}
