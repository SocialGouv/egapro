import type { LegacyTokenRequire } from "@api/core-domain/infra/db/http/next/decorator/LegacyTokenRequire";
import { globalMailerService } from "@api/core-domain/infra/mail";
import { ownershipRequestRepo } from "@api/core-domain/repo";
import { CreateOwnershipRequest, CreateOwnershipRequestError } from "@api/core-domain/useCases/CreateOwnershipRequest";
import {
  UpdateOwnershipRequestStatus,
  UpdateOwnershipRequestStatusError,
} from "@api/core-domain/useCases/UpdateOwnershipRequestStatus";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler } from "@api/shared-domain/infra/http/next/Decorators";
import type { UseCaseParameters } from "@common/shared-domain";
import { AppError, ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";

type TokenReq = LegacyTokenRequire.Wrap<NextController.Req<NextController>>;
type Req = NextController.Req<NextController>;
type Res = NextController.Res<NextController>;

@Handler
export default class DeclarationSirenController implements NextController {
  public async put(req: Req, res: Res) {
    type Input = UseCaseParameters<CreateOwnershipRequest>[0];
    const useCase = new CreateOwnershipRequest(ownershipRequestRepo);
    const { sirens, emails, askerEmail } = req.body as unknown as Input;

    try {
      const warnings = await useCase.execute({ sirens, emails, askerEmail });
      res
        .status(StatusCodes.CREATED)
        .json({ warnings: warnings.map(warning => [warning.errorCode, warning.errorMessage]) });
    } catch (error: unknown) {
      if (error instanceof CreateOwnershipRequestError) {
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
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }

  //   @LegacyTokenRequire
  public async post(req: TokenReq, res: Res) {
    type Input = UseCaseParameters<UpdateOwnershipRequestStatus>[0];
    const useCase = new UpdateOwnershipRequestStatus(ownershipRequestRepo, globalMailerService);
    const { uuids, action } = req.body as unknown as Input;

    try {
      await useCase.execute({ uuids, action });

      res.status(StatusCodes.OK).send(null);
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
