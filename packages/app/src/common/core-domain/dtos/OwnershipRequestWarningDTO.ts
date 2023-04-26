import { type ErrorDetailTuple } from "../domain/valueObjects/ownership_request/ErrorDetail";

export interface OwnershipRequestWarningsDTO {
  warnings: ErrorDetailTuple[];
}
