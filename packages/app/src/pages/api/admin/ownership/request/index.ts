import { LegacyTokenRequire } from "@api/core-domain/infra/db/http/next/decorator/LegacyTokenRequire";
import { globalMailerService } from "@api/core-domain/infra/mail";
import { ownershipRequestRepo } from "@api/core-domain/repo";
import { GetOwnershipRequest, GetOwnershipRequestError } from "@api/core-domain/useCases/GetOwnershipRequest";
import {
  UpdateOwnershipRequestStatus,
  UpdateOwnershipRequestStatusError,
} from "@api/core-domain/useCases/UpdateOwnershipRequestStatus";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler } from "@api/shared-domain/infra/http/next/Decorators";
import type { UseCaseParameters } from "@common/shared-domain";
import { AppError, ValidationError } from "@common/shared-domain";
import { normalizeQueryParam } from "@common/utils/url";
import { StatusCodes } from "http-status-codes";

type TokenReq = LegacyTokenRequire.Wrap<NextController.Req<NextController>>;
type Res = NextController.Res<NextController>;

@Handler
export default class AdminOwnershipRequestController implements NextController {
  // TODO: add normalizeQueryParam equivalent to NextControllerRequest or ControllerRequest
  // or make a @RouteZodQuery(z.schema) decorator (like ParamsChecker component)
  @LegacyTokenRequire({ staffOnly: true })
  public async get(req: TokenReq, res: Res) {
    const {
      siren: sirenQuery,
      status: statusQuery,
      limit: limitQuery,
      offset: offsetQuery,
      orderBy: orderByQuery,
      orderAsc: orderAscQuery,
    } = req.query;

    const siren = normalizeQueryParam(sirenQuery) || undefined;
    const status = normalizeQueryParam(statusQuery) || undefined;
    const limit = normalizeQueryParam(limitQuery) || undefined;
    const offset = normalizeQueryParam(offsetQuery) || undefined;
    const orderBy = normalizeQueryParam(orderByQuery) || undefined;
    const orderAsc = normalizeQueryParam(orderAscQuery) || undefined;

    try {
      const useCase = new GetOwnershipRequest(ownershipRequestRepo);
      const ownershipRequests = await useCase.execute({ siren, status, limit, offset, orderBy, orderAsc });
      res.status(200).json(ownershipRequests);
    } catch (error: unknown) {
      if (error instanceof GetOwnershipRequestError) {
        if (error.previousError instanceof ValidationError) {
          return res.status(422).json({ errorMessage: error.previousError.message });
        }
        res.status(400).json({
          errorMessage: error
            .appErrorList()
            .map(e => e.message)
            .join(" | "),
        });
      } else {
        console.error(error);
        res.status(500).send(null);
      }
    }
  }

  @LegacyTokenRequire({ staffOnly: true })
  public async post(req: TokenReq, res: Res) {
    type Input = UseCaseParameters<UpdateOwnershipRequestStatus>[0];
    const useCase = new UpdateOwnershipRequestStatus(ownershipRequestRepo, globalMailerService);
    const { uuids, action } = req.body as unknown as Input;

    try {
      const warningsDTO = await useCase.execute({ uuids, action });

      res.status(StatusCodes.OK).json(warningsDTO);
    } catch (error: unknown) {
      if (error instanceof UpdateOwnershipRequestStatusError) {
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(error.previousError.message);
        }
        res.status(StatusCodes.BAD_REQUEST).json({
          errorMessage: error
            .appErrorList()
            .map(e => e.message)
            .join(" | "),
        });
      } else {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR);
        if (error instanceof AppError) {
          res.json({
            errorMessage: error
              .appErrorList()
              .map(e => e.message)
              .join(" | "),
          });
        } else res.send(null);
      }
    }
  }
}
