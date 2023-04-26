import { LegacyTokenRequire } from "@api/core-domain/infra/http/next/decorator/LegacyTokenRequire";
import { declarationRepo } from "@api/core-domain/repo";
import {
  UpdateDeclarationWithOpMc,
  UpdateDeclarationWithOpMcError,
} from "@api/core-domain/useCases/UpdateDeclarationWithOpMc";
import { type NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler, RouteZodBody } from "@api/shared-domain/infra/http/next/Decorators";
import { type UpdateOpMcDTO } from "@common/core-domain/dtos/UpdateOpMcDTO";
import { updateOpMcDTOSchema } from "@common/core-domain/dtos/UpdateOpMcDTO";
import { ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";

type BaseController = NextController<"siren" | "year">;
type Req = LegacyTokenRequire.Wrap<NextController.Req<BaseController>>;
type Res = NextController.Res<BaseController>;

@Handler
export default class OpMcSirenYearController implements BaseController {
  @LegacyTokenRequire({ ensureOwner: true })
  @RouteZodBody(updateOpMcDTOSchema)
  public async post(req: Req, res: Res) {
    const useCase = new UpdateDeclarationWithOpMc(declarationRepo);
    const { siren, year } = req.params;
    const opmc = req.body as UpdateOpMcDTO;

    try {
      await useCase.execute({ siren, year, opmc });
      res.status(StatusCodes.NO_CONTENT).send(null);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof UpdateDeclarationWithOpMcError) {
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
