import { LegacyTokenRequire } from "@api/core-domain/infra/http/next/decorator/LegacyTokenRequire";
import { globalMailerService } from "@api/core-domain/infra/mail";
import { ownershipRequestRepo } from "@api/core-domain/repo";
import { GetOwnershipRequest, GetOwnershipRequestError } from "@api/core-domain/useCases/GetOwnershipRequest";
import {
  UpdateOwnershipRequestStatus,
  UpdateOwnershipRequestStatusError,
} from "@api/core-domain/useCases/UpdateOwnershipRequestStatus";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler, RouteZodQuery } from "@api/shared-domain/infra/http/next/Decorators";
import type { GetOwnershipRequestInputDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { getOwnershipRequestInputDTOSchema } from "@common/core-domain/dtos/OwnershipRequestDTO";
import type { UseCaseParameters } from "@common/shared-domain";
import { AppError, ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";

type TokenReq = LegacyTokenRequire.Wrap<NextController.Req<NextController>>;
type Res = NextController.Res<NextController>;

@Handler
export default class AdminOwnershipRequestController implements NextController {
  @LegacyTokenRequire({ staffOnly: true })
  @RouteZodQuery(getOwnershipRequestInputDTOSchema)
  public async get(req: TokenReq, res: Res) {
    const params = req.query as GetOwnershipRequestInputDTO;

    try {
      const useCase = new GetOwnershipRequest(ownershipRequestRepo);
      const ownershipRequests = await useCase.execute(params);
      res.status(StatusCodes.OK).json(ownershipRequests);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof GetOwnershipRequestError) {
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: error.previousError.message });
        }
        res.status(StatusCodes.BAD_REQUEST).json({
          errorMessage: error
            .appErrorList()
            .map(e => e.message)
            .join(" | "),
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }

  @LegacyTokenRequire({ staffOnly: true })
  public async post(req: TokenReq, res: Res) {
    type Input = UseCaseParameters<UpdateOwnershipRequestStatus>[0];
    const useCase = new UpdateOwnershipRequestStatus(ownershipRequestRepo, globalMailerService);

    if (!req.body) {
      throw new ValidationError("Empty body.");
    }

    const { uuids, action } = req.body as unknown as Input;

    try {
      const warningsDTO = await useCase.execute({ uuids, action });

      res.status(StatusCodes.OK).json(warningsDTO);
    } catch (error: unknown) {
      console.error(error);
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
