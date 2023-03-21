import { LegacyTokenRequire } from "@api/core-domain/infra/http/next/decorator/LegacyTokenRequire";
import { referentRepo } from "@api/core-domain/repo";
import { ImportReferents, ImportReferentsError } from "@api/core-domain/useCases/referent/ImportReferents";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler } from "@api/shared-domain/infra/http/next/Decorators";
import { ValidationError } from "@common/shared-domain";
import formidable from "formidable";
import { readFileSync, unlinkSync } from "fs";
import { StatusCodes } from "http-status-codes";
import type { PageConfig } from "next";

type TokenReq = LegacyTokenRequire.Wrap<NextController.Req<NextController>>;
type Res = NextController.Res<NextController>;
@Handler
export default class AdminReferentImportController implements NextController {
  @LegacyTokenRequire({ staffOnly: true })
  public async put(req: TokenReq, res: Res) {
    const useCase = new ImportReferents(referentRepo);

    try {
      const referents = await this.getFileData(req);
      await useCase.execute(referents);
      res.status(StatusCodes.NO_CONTENT).send(null);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof ImportReferentsError) {
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send({ error: error.previousError.message });
        }
        res.status(StatusCodes.BAD_REQUEST).send({ error: error.appErrorList().map(e => e.message) });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }

  // TODO as decorator
  private async getFileData(req: TokenReq) {
    const form = formidable({ uploadDir: "./" });
    const content = await new Promise<string>((resolve, reject) => {
      form.parse(req._req, (error, _fields, files) => {
        if (error) return reject(error);
        const file = Object.values(files)[0] as formidable.File;

        resolve(readFileSync(file.filepath, { encoding: "utf-8" }));
        unlinkSync(file.filepath);
      });
    });

    return JSON.parse(content);
  }
}

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};
