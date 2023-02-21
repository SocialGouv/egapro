import { LegacyTokenRequire } from "@api/core-domain/infra/http/next/decorator/LegacyTokenRequire";
import { declarationRepo } from "@api/core-domain/repo";
import {
  CreateDeclarationBySirenAndYear,
  CreateDeclarationBySirenAndYearError,
} from "@api/core-domain/useCases/CreateDeclarationBySirenAndYear";
import {
  GetDeclarationBySirenAndYear,
  GetDeclarationBySirenAndYearError,
} from "@api/core-domain/useCases/GetDeclarationBySirenAndYear";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler } from "@api/shared-domain/infra/http/next/Decorators";
import type { DeclarationDTO } from "@common/models/generated";
import { ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";

type BaseController = NextController<"siren" | "year">;
type TokenReq = LegacyTokenRequire.Wrap<NextController.Req<BaseController>>;
type Res = NextController.Res<BaseController>;

@Handler
export default class DeclarationSirenYearController implements BaseController {
  @LegacyTokenRequire({ ensureOwner: true })
  public async get(req: TokenReq, res: Res) {
    const useCase = new GetDeclarationBySirenAndYear(declarationRepo);
    const { siren, year } = req.params;

    try {
      const ret = await useCase.execute({ siren, year });
      if (ret) res.status(StatusCodes.OK).json(ret);
      else res.status(StatusCodes.NOT_FOUND).send(null);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof GetDeclarationBySirenAndYearError) {
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(error.previousError.message);
        }
        res.status(StatusCodes.BAD_REQUEST).send(error.appErrorList().map(e => e.message));
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }

  @LegacyTokenRequire({ ensureOwner: true })
  public async put(req: TokenReq, res: Res) {
    const useCase = new CreateDeclarationBySirenAndYear(declarationRepo);
    const { siren, year } = req.params;

    if (!req.body) {
      throw new ValidationError("Empty body.");
    }

    const data = req.body as unknown as DeclarationDTO;
    try {
      await useCase.execute({ siren, year, data });
      res.status(StatusCodes.OK).send(null);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof CreateDeclarationBySirenAndYearError) {
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(error.previousError.message);
        }
        res.status(StatusCodes.BAD_REQUEST).send(error.appErrorList().map(e => e.message));
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }
}
