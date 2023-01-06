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
import { ensureRequired } from "@common/utils/types";
import _ from "lodash";

import type { IGlobalMailerService } from "../infra/mail/IGlobalMailerService";
import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";

const KNOWN_ACTIONS: Array<OwnershipRequestActionDTO["action"]> = ["accept", "refuse"];

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

    const isAccepted = action === "accept";
    const newStatus = isAccepted ? OwnershipRequestStatus.Enum.ACCEPTED : OwnershipRequestStatus.Enum.REFUSED;

    const ownershipRequests = await this.ownershipRequestRepo.getMultiple(...uuids.map(uuid => new UniqueID(uuid)));

    if (!ownershipRequests.length || ownershipRequests.length !== uuids.length) {
      throw new UpdateOwnershipRequestStatusNotFoundError(
        `No ownership requests where found with one or all given uuids (${uuids})`,
      );
    }

    // logic:
    // 1   split ownershiprequest into processableRequests and alreadyProcessedRequests
    // 1.1 save all ownerships and update requests with newStatus
    // 1.2 if update fail, ensure rollback and throw
    // 1.3 else add processableRequests in askerGroup and declarantGroup (accordingly to isAccepted for declarantGroup)
    // 1.4 save alreadyProcessedRequests in failedRequests with ALREADY_PROCESSED errorDetail
    // 2   loop over askerGroup
    // 2.1 in loop, send mail to asker and if send failed or rejected, save in failedRequests with EMAIL_DELIVERY_KO
    // 3   loop over declarantGroup outfiltered from failedRequests
    // 3.1 in loop, send mail to declarant if send failed or rejected, save in failedRequests with EMAIL_DELIVERY_KO
    // 4   loop over failedRequests without DB_ERROR or ALREADY_PROCESSED ones and update with ERROR status and errorDetail
    // 4.1 if any update fail, throw error
    // 5   build warnings from failedRequests and return

    const failedRequests = new Map<string, ErrorDetail>();

    // group requests
    const groupByAsker = new Map<string, string[]>();
    const groupByDeclarant = new Map<string, string[]>();

    // 1
    const [processableRequests, alreadyProcessedRequests] = _.partition(
      ownershipRequests,
      request => request.shouldBeProcessed,
    );

    if (processableRequests.length) {
      processableRequests.forEach(request => request.changeStatus(newStatus));
      try {
        // 1.1
        // NB: This call to `updateWithOwnershipBulk` makes an update in `ownership` table as well, wrapped in a transaction. /!\
        await this.ownershipRequestRepo.updateWithOwnershipBulk(...processableRequests);
      } catch (error: unknown) {
        // 1.2
        console.error(error);
        throw new UpdateOwnershipRequestStatusError("Cannot create an ownership request", error as Error);
      }

      // 1.3
      for (const request of processableRequests) {
        const processable = ensureRequired(request);
        const uuid = processable.id.getValue();

        const askerGroup = groupByAsker.get(request.askerEmail.getValue()) ?? [];
        askerGroup.push(uuid);
        groupByAsker.set(request.askerEmail.getValue(), askerGroup);

        // we only want to notify declarants on validation, not on rejection
        if (isAccepted) {
          const declarantGroup = groupByDeclarant.get(processable.email.getValue()) ?? [];
          declarantGroup.push(uuid);
          groupByDeclarant.set(processable.email.getValue(), declarantGroup);
        }
      }
    }

    for (const request of alreadyProcessedRequests) {
      const uuid = ensureRequired(request).id.getValue();
      // 1.4
      failedRequests.set(
        uuid,
        new ErrorDetail([
          "ALREADY_PROCESSED",
          `The ownership request [${
            request.ownershipRequested
          }] is already with status "${request.status.getValue()}" and therefore cannot be set to "${newStatus}". No mails were sent to "asker" nor "declarants".`,
        ]),
      );
      console.warn(
        `Request ${uuid} is already with status "${request.status.getValue()}" and therefore cannot be set to "${newStatus}"`,
        request,
      );
    }

    // process requests
    await this.globalMailerService.init();

    // 2
    for (const [askerMail, requestIds] of groupByAsker) {
      const filteredRequests = processableRequests.filter(request =>
        requestIds.includes(ensureRequired(request).id.getValue()),
      );

      const [, rejected] = await this.globalMailerService.sendMail(
        isAccepted ? "ownershipRequest_toAskerAfterValidation" : "ownershipRequest_toAskerAfterRejection",
        { to: askerMail },
        filteredRequests.map(r => r.ownershipRequested),
      );

      // 2.1
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

    // 3
    for (const [declarantMail, requestIds] of groupByDeclarant) {
      const filteredRequests = processableRequests.filter(request => {
        const uuid = ensureRequired(request).id.getValue();
        // still have to filter against failedRequests because we could had
        // some rejected askers
        return requestIds.includes(uuid) && !failedRequests.has(uuid);
      });

      for (const request of filteredRequests) {
        const processable = ensureRequired(request);
        const [, rejected] = await this.globalMailerService.sendMail(
          "ownershipRequest_toDeclarantAfterValidation",
          { to: declarantMail },
          declarantMail,
          processable.siren.getValue(),
        );

        // 3.1
        if (rejected.includes(declarantMail)) {
          // avoid trying to send to the same declarant other requests
          // continue for other declarants
          requestIds.forEach(id =>
            failedRequests.set(
              id,
              new ErrorDetail(["EMAIL_DELIVERY_KO", `Declarant email ${declarantMail} was rejected.`]),
            ),
          );
          break;
        }
      }
    }

    const out: OwnershipRequestWarningsDTO = {
      warnings: [],
    };
    for (const [uuid, errorDetail] of failedRequests) {
      // 4
      if (errorDetail.errorCode !== "ALREADY_PROCESSED") {
        try {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- always found
          const request = ownershipRequests.find(r => r.id?.getValue() === uuid)!;
          request.changeStatus(OwnershipRequestStatus.Enum.ERROR, errorDetail);
          await this.ownershipRequestRepo.update(request);
        } catch (error: unknown) {
          throw new UpdateOwnershipRequestStatusError("Cannot create an ownership request", error as Error);
        }
      }

      // 5
      out.warnings.push([errorDetail.errorCode, errorDetail.errorMessage]);
    }

    return out;
  }

  private guardKnownAction(action: OwnershipRequestActionDTO["action"]): action is OwnershipRequestAction {
    return KNOWN_ACTIONS.includes(action);
  }
}

export class UpdateOwnershipRequestStatusError extends AppError {}
export class UpdateOwnershipRequestStatusUnsuportedActionError extends UpdateOwnershipRequestStatusError {}
export class UpdateOwnershipRequestStatusNotFoundError extends UpdateOwnershipRequestStatusError {}
export class UpdateOwnershipRequestStatusNoUuidsError extends UpdateOwnershipRequestStatusError {}
