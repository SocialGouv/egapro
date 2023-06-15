import { type NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler } from "@api/shared-domain/infra/http/next/Decorators";
import { config } from "@common/config";
import { StatusCodes } from "http-status-codes";

type Req = NextController.Req<NextController>;
type Res = NextController.Res<NextController>;

@Handler
export default class DebugController implements NextController {
  public async get(req: Req, res: Res) {
    res.status(StatusCodes.OK).send({
      DB_NAME: config.api.postgres.db,
      DB_HOST: config.api.postgres.host,
      DB_PORT: config.api.postgres.port,
    });
  }
}
