import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type {
  OwnershipRequestAction,
  OwnershipRequestActionDTO,
} from "@common/core-domain/dtos/OwnershipRequestActionDTO";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { UniqueID } from "@common/shared-domain/domain/valueObjects";

import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";

const KNOWN_ACTIONS: Array<OwnershipRequestActionDTO["action"]> = ["accept", "reject"];

export class UpdateOwnershipRequestStatus implements UseCase<OwnershipRequestActionDTO, void> {
  constructor(private readonly ownershipRequestRepo: IOwnershipRequestRepo) {}

  public async execute({ uuids, action }: OwnershipRequestActionDTO): Promise<void> {
    if (!this.guardKnownAction(action)) {
      throw new UpdateOwnershipRequestStatusUnsuportedActionError(
        `Given action "${action}" is not known. Only "${KNOWN_ACTIONS}" are available.`,
      );
    }

    const newStatus = action === "accept" ? OwnershipRequestStatus.Enum.PROCESSED : OwnershipRequestStatus.Enum.REFUSED;

    const ownershipRequests = await this.ownershipRequestRepo.getMultiple(...uuids.map(uuid => new UniqueID(uuid)));

    // group requests
    const groupByAsker = new Map<string, string[]>();
    const groupByDeclarant = new Map<string, string[]>();
    for (const request of ownershipRequests) {
      if (request.shouldBeProcessed) {
        const uuid = request.id?.getValue();
        if (!uuid) {
          throw new UpdateOwnershipRequestStatusBadDbDataError("Some fetched requests do not have a uuid.");
        }

        const askerGroup = groupByAsker.get(request.askerEmail.getValue()) ?? [];
        askerGroup.push(uuid);
        groupByAsker.set(request.askerEmail.getValue(), askerGroup);

        const declarantGroup = groupByDeclarant.get(request.email.getValue()) ?? [];
        declarantGroup.push(uuid);
        groupByDeclarant.set(request.email.getValue(), askerGroup);
      } else {
        console.warn(
          `Request ${request.id?.getValue()} is already with status "${request.status.getValue()}" and therefore cannot be set to "${newStatus}"`,
          request,
        );
      }
    }

    // process requests
  }

  private guardKnownAction(action: OwnershipRequestActionDTO["action"]): action is OwnershipRequestAction {
    return KNOWN_ACTIONS.includes(action);
  }
}

export class UpdateOwnershipRequestStatusError extends AppError {}
export class UpdateOwnershipRequestStatusUnsuportedActionError extends UpdateOwnershipRequestStatusError {}
export class UpdateOwnershipRequestStatusBadDbDataError extends UpdateOwnershipRequestStatusError {}
