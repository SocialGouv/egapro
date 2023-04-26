import { LegacyTokenRequire } from "@api/core-domain/infra/http/next/decorator/LegacyTokenRequire";
import { referentRepo } from "@api/core-domain/repo";
import {
  DeleteReferent,
  DeleteReferentError,
  DeleteReferentNotFoundError,
} from "@api/core-domain/useCases/referent/DeleteReferent";
import {
  EditReferent,
  EditReferentError,
  EditReferentNotFoundError,
} from "@api/core-domain/useCases/referent/EditReferent";
import { type NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler, RouteZodBody } from "@api/shared-domain/infra/http/next/Decorators";
import { type EditReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { editReferentDTOSchema } from "@common/core-domain/dtos/ReferentDTO";
import { ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";

type BaseController = NextController<"id">;
type TokenReq = LegacyTokenRequire.Wrap<NextController.Req<BaseController>>;
type Res = NextController.Res<BaseController>;

@Handler
export default class AdminReferentByIdController implements BaseController {
  @LegacyTokenRequire({ staffOnly: true })
  public async delete(req: TokenReq, res: Res) {
    const useCase = new DeleteReferent(referentRepo);

    try {
      await useCase.execute(req.params.id);
      return res.status(StatusCodes.NO_CONTENT).send(null);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof DeleteReferentError) {
        if (error instanceof DeleteReferentNotFoundError) {
          return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send({ error: error.previousError.message });
        }
        res.status(StatusCodes.BAD_REQUEST).send({ error: error.appErrorList().map(e => e.message) });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }

  @LegacyTokenRequire({ staffOnly: true })
  @RouteZodBody(editReferentDTOSchema)
  public async post(req: TokenReq, res: Res) {
    const useCase = new EditReferent(referentRepo);
    const dto = req.body as unknown as EditReferentDTO;

    try {
      await useCase.execute(dto);
      res.status(StatusCodes.NO_CONTENT).send(null);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof EditReferentError) {
        if (error instanceof EditReferentNotFoundError) {
          return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
        }
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ error: error.previousError.message });
        }
        res.status(StatusCodes.BAD_REQUEST).json({ error: error.appErrorList().map(e => e.message) });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }
}
