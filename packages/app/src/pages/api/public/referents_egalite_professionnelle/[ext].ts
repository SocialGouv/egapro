import type { LegacyTokenRequire } from "@api/core-domain/infra/http/next/decorator/LegacyTokenRequire";
import { referentRepo } from "@api/core-domain/repo";
import type { ValidExportExtension } from "@api/core-domain/useCases/referent/ExportReferents";
import {
  EXPORT_EXT,
  EXPORT_MIME,
  ExportReferents,
  ExportReferentsError,
} from "@api/core-domain/useCases/referent/ExportReferents";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler } from "@api/shared-domain/infra/http/next/Decorators";
import { ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";
import { pipeline } from "stream";

type BaseController = NextController<"ext">;
type TokenReq = LegacyTokenRequire.Wrap<NextController.Req<BaseController>>;
type Res = NextController.Res<BaseController>;

@Handler
export default class AdminReferentByIdController implements BaseController {
  public async get(req: TokenReq, res: Res) {
    const useCase = new ExportReferents(referentRepo);
    const ext = req.params.ext;

    try {
      this.assertExtension(ext);
      const stream = await useCase.execute(ext);
      res.header("Content-Type", EXPORT_MIME[ext]);
      pipeline(stream, res._res, error => {
        error && res.header("Content-Type", EXPORT_MIME["json"]).status(StatusCodes.INTERNAL_SERVER_ERROR).json({});
      });
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof ExportReferentsError) {
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send({ error: error.previousError.message });
        }
        res.status(StatusCodes.BAD_REQUEST).send({ error: error.appErrorList().map(e => e.message) });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }

  private assertExtension(ext: string): asserts ext is ValidExportExtension {
    if (!EXPORT_EXT.includes(ext as ValidExportExtension)) {
      throw new ValidationError(`Valid extensions are ${EXPORT_EXT}`);
    }
  }
}
