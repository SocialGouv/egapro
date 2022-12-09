import { EnsureOwner } from "@api/core-domain/infra/db/http/next/decorator/EnsureOwner";
import { TokenV1Require } from "@api/core-domain/infra/db/http/next/decorator/TokenV1Require";
import { representationEquilibreeRepo } from "@api/core-domain/repo";
import {
  GetRepresentationEquilibreeBySirenAndYear,
  GetRepresentationEquilibreeBySirenAndYearError,
} from "@api/core-domain/useCases/GetRepresentationEquilibreeBySirenAndYear";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler } from "@api/shared-domain/infra/http/next/Decorators";
import { ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";

type BaseController = NextController<"siren" | "year">;
type Req = EnsureOwner.Wrap<TokenV1Require.Wrap<NextController.Req<BaseController>>>;
type Res = NextController.Res<BaseController>;

@Handler
export default class RepEqSirenYearController implements BaseController {
  @TokenV1Require
  @EnsureOwner
  public async get(req: Req, res: Res) {
    const useCase = new GetRepresentationEquilibreeBySirenAndYear(representationEquilibreeRepo);
    const { siren, year } = req.params;

    try {
      const ret = await useCase.execute({ siren, year });
      if (ret) res.status(StatusCodes.OK).json(ret);
      else res.status(StatusCodes.NOT_FOUND).send(null);
    } catch (error: unknown) {
      if (error instanceof GetRepresentationEquilibreeBySirenAndYearError) {
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(error.previousError.message);
        }
        res.status(StatusCodes.BAD_REQUEST).send(error.appErrorList().map(e => e.message));
      } else {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }
}
