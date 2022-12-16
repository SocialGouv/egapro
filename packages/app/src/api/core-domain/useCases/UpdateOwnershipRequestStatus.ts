import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type {
  OwnershipRequestAction,
  OwnershipRequestActionDTO,
} from "@common/core-domain/dtos/OwnershipRequestActionDTO";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { UniqueID } from "@common/shared-domain/domain/valueObjects";

import type { IGlobalMailerService } from "../infra/mail/IGlobalMailerService";
import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";

const KNOWN_ACTIONS: Array<OwnershipRequestActionDTO["action"]> = ["accept", "reject"];

export class UpdateOwnershipRequestStatus implements UseCase<OwnershipRequestActionDTO, void> {
  constructor(
    private readonly ownershipRequestRepo: IOwnershipRequestRepo,
    private readonly globalMailerService: IGlobalMailerService,
  ) {}

  public async execute({ uuids, action }: OwnershipRequestActionDTO): Promise<void> {
    if (!this.guardKnownAction(action)) {
      throw new UpdateOwnershipRequestStatusUnsuportedActionError(
        `Given action "${action}" is not known. Only "${KNOWN_ACTIONS}" are available.`,
      );
    }

    if (!uuids.length) {
      throw new UpdateOwnershipRequestStatusNoUuidsError(`At least one uuid must be given.`);
    }

    const shouldProcess = action === "accept";
    const newStatus = shouldProcess ? OwnershipRequestStatus.Enum.PROCESSED : OwnershipRequestStatus.Enum.REFUSED;

    const ownershipRequests = await this.ownershipRequestRepo.getMultiple(...uuids.map(uuid => new UniqueID(uuid)));

    if (!ownershipRequests.length) {
      throw new UpdateOwnershipRequestStatusNotFoundError(
        `No ownership requests where found with given uuids (${uuids})`,
      );
    }

    // group requests
    const groupByAsker = new Map<string, string[]>();
    const groupByDeclarant = new Map<string, string[]>();
    for (const request of ownershipRequests) {
      if (request.shouldBeProcessed) {
        const processable = request._required;
        const uuid = processable.id.getValue();

        const askerGroup = groupByAsker.get(request.askerEmail.getValue()) ?? [];
        askerGroup.push(uuid);
        groupByAsker.set(request.askerEmail.getValue(), askerGroup);

        // we only want to notify declarants on validation, not on rejection
        if (shouldProcess) {
          const declarantGroup = groupByDeclarant.get(processable.email.getValue()) ?? [];
          declarantGroup.push(uuid);
          groupByDeclarant.set(processable.email.getValue(), declarantGroup);
        }
      } else {
        console.warn(
          `Request ${request.id?.getValue()} is already with status "${request.status.getValue()}" and therefore cannot be set to "${newStatus}"`,
          request,
        );
      }
    }

    // process requests
    await this.globalMailerService.init();

    const failedRequests: string[] = [];
    for (const [askerMail, requestIds] of groupByAsker) {
      const filteredRequests = ownershipRequests.filter(request =>
        requestIds.includes(request._required.id.getValue()),
      );

      const [, rejected] = await this.globalMailerService.sendMail(
        shouldProcess ? "ownershipRequest_toAskerAfterValidation" : "ownershipRequest_toAskerAfterRejection",
        { to: askerMail },
        filteredRequests.map(r => r.ownershipRequested),
      );

      if (rejected.includes(askerMail)) {
        // avoid trying to send to declarants
        requestIds.forEach(id => failedRequests.push(id)); // TODO include reason for later save in error_detail
        // TODO status error + 'mail not sent' as error detail
        // + continue for other asker
      }
    }

    for (const [declarantMail, requestIds] of groupByDeclarant) {
      for (const id of requestIds) {
        if (failedRequests.includes(id)) {
          continue;
        }

        const foundRequest = ownershipRequests.find(request => request._required.id.getValue() === id)!;

        const [, rejected] = await this.globalMailerService.sendMail(
          "ownershipRequest_toDeclarantAfterValidation",
          { to: declarantMail },
          declarantMail,
          foundRequest._required.siren.getValue(),
        );

        if (rejected.includes(declarantMail)) {
          failedRequests.push(id); // TODO include reason for later save in error_detail
          // TODO status error + 'mail not sent' as error detail
          // but keep going to next declarant
          continue;
        }

        foundRequest.changeStatus(newStatus);
        await this.ownershipRequestRepo.save(foundRequest);
      }
    }
  }

  private guardKnownAction(action: OwnershipRequestActionDTO["action"]): action is OwnershipRequestAction {
    return KNOWN_ACTIONS.includes(action);
  }
}

export class UpdateOwnershipRequestStatusError extends AppError {}
export class UpdateOwnershipRequestStatusUnsuportedActionError extends UpdateOwnershipRequestStatusError {}
export class UpdateOwnershipRequestStatusBadDbDataError extends UpdateOwnershipRequestStatusError {}
export class UpdateOwnershipRequestStatusNotFoundError extends UpdateOwnershipRequestStatusError {}
export class UpdateOwnershipRequestStatusNoUuidsError extends UpdateOwnershipRequestStatusError {}
