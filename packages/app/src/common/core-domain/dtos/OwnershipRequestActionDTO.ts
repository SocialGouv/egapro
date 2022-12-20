export type OwnershipRequestAction = "accept" | "refuse";
export interface OwnershipRequestActionDTO {
  action: OwnershipRequestAction;
  uuids: string[];
}
