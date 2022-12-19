import type { ErrorDetailTuple } from "@common/core-domain/domain/valueObjects/ownership_request/ErrorDetail";
import { ErrorDetail } from "@common/core-domain/domain/valueObjects/ownership_request/ErrorDetail";
import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type {
  OwnershipRequestAction,
  OwnershipRequestActionDTO,
} from "@common/core-domain/dtos/OwnershipRequestActionDTO";
import type { OwnershipRequestWarningsDTO } from "@common/core-domain/dtos/OwnershipRequestWarningDTO";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { UniqueID } from "@common/shared-domain/domain/valueObjects";

import type { IGlobalMailerService } from "../infra/mail/IGlobalMailerService";
import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";

const KNOWN_ACTIONS: Array<OwnershipRequestActionDTO["action"]> = ["accept", "reject"];

export class UpdateOwnershipRequestStatus implements UseCase<OwnershipRequestActionDTO, OwnershipRequestWarningsDTO> {
  constructor(
    private readonly ownershipRequestRepo: IOwnershipRequestRepo,
    private readonly globalMailerService: IGlobalMailerService,
  ) {}

  public async execute({ uuids, action }: OwnershipRequestActionDTO): Promise<OwnershipRequestWarningsDTO> {
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

    if (!ownershipRequests.length || ownershipRequests.length !== uuids.length) {
      throw new UpdateOwnershipRequestStatusNotFoundError(
        `No ownership requests where found with one or all given uuids (${uuids})`,
      );
    }

    const failedRequests = new Map<string, ErrorDetail>();

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
        failedRequests.set(
          request._required.id.getValue(),
          new ErrorDetail([
            "ALREADY_PROCESSED",
            `The ownership request [${
              request.ownershipRequested
            }] is already with status "${request.status.getValue()}" and therefore cannot be set to "${newStatus}". No mails were sent to "asker" nor "declarants".`,
          ]),
        );
        console.warn(
          `Request ${request.id?.getValue()} is already with status "${request.status.getValue()}" and therefore cannot be set to "${newStatus}"`,
          request,
        );
      }
    }

    // process requests
    await this.globalMailerService.init();

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
        // continue for other askers
        requestIds.forEach(id =>
          failedRequests.set(
            id,
            new ErrorDetail([
              "EMAIL_DELIVERY_KO",
              `Asker email ${askerMail} was rejected. No mail were sent to "declarants".`,
            ]),
          ),
        );
      }
    }

    for (const [declarantMail, requestIds] of groupByDeclarant) {
      for (const id of requestIds) {
        // confirm avoid trying to send to declarants
        if (failedRequests.has(id)) {
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
          failedRequests.set(
            id,
            new ErrorDetail(["EMAIL_DELIVERY_KO", `Declarant email ${declarantMail} was rejected.`]),
          );
        }

        const maybeErrorDetail = failedRequests.get(id);
        if (maybeErrorDetail) {
          foundRequest.changeStatus(OwnershipRequestStatus.Enum.ERROR, maybeErrorDetail);
        } else {
          foundRequest.changeStatus(newStatus);
        }

        try {
          await this.ownershipRequestRepo.update(foundRequest);
        } catch (error: unknown) {
          throw new UpdateOwnershipRequestStatusError("Cannot create an ownership request", error as Error);
        }
      }
    }

    return {
      warnings: [...failedRequests.values()].map<ErrorDetailTuple>(warning => [
        warning.errorCode,
        warning.errorMessage,
      ]),
    };
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
