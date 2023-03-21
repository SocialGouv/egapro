import { LegacyTokenRequire } from "@api/core-domain/infra/http/next/decorator/LegacyTokenRequire";
import { referentRepo } from "@api/core-domain/repo";
import { GetReferents, GetReferentsError } from "@api/core-domain/useCases/referent/GetReferents";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler, RouteZodBody } from "@api/shared-domain/infra/http/next/Decorators";
import { createReferentDTOSchema } from "@common/core-domain/dtos/ReferentDTO";
import { StatusCodes } from "http-status-codes";
import { ValidationError } from "json-schema-to-typescript";

type TokenReq = LegacyTokenRequire.Wrap<NextController.Req<NextController>>;
type Res = NextController.Res<NextController>;
@Handler
export default class AdminReferentController implements NextController {
  @LegacyTokenRequire({ staffOnly: true })
  public async get(req: TokenReq, res: Res) {
    const useCase = new GetReferents(referentRepo);

    try {
      return res.status(StatusCodes.OK).json(await useCase.execute());
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof GetReferentsError) {
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(error.previousError.message);
        }
        res.status(StatusCodes.BAD_REQUEST).send(error.appErrorList().map(e => e.message));
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }

  //   @LegacyTokenRequire({ staffOnly: true })
  //   @RouteZodBody(referentDTOSchema)
  //   public async post(req: TokenReq, res: Res) {
  //     // update
  //   }

  @LegacyTokenRequire({ staffOnly: true })
  @RouteZodBody(createReferentDTOSchema)
  public async put(req: TokenReq, res: Res) {
    // create
  }

  //   @LegacyTokenRequire({ staffOnly: true })
  //   @RouteZodBody(z.object({ id: z.string() }))
  //   public async delete(req: TokenReq, res: Res) {
  //     // create
  //   }
}
