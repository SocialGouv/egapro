import { LegacyTokenRequire } from "@api/core-domain/infra/http/next/decorator/LegacyTokenRequire";
import { declarationRepo } from "@api/core-domain/repo";
import {
  GetAllDeclarationsBySiren,
  GetAllDeclarationsBySirenError,
} from "@api/core-domain/useCases/GetAllDeclarationsBySiren";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler } from "@api/shared-domain/infra/http/next/Decorators";
import { ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";

type BaseController = NextController<"siren">;
type Req = LegacyTokenRequire.Wrap<NextController.Req<BaseController>>;
type Res = NextController.Res<BaseController>;

@Handler
export default class DeclarationSirenController implements BaseController {
  @LegacyTokenRequire({ ensureOwner: true })
  public async get(req: Req, res: Res) {
    const useCase = new GetAllDeclarationsBySiren(declarationRepo);
    const { siren } = req.params;

    try {
      const ret = await useCase.execute({ siren });
      res.status(StatusCodes.OK).json(ret);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof GetAllDeclarationsBySirenError) {
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
