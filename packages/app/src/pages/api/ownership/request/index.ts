import { entrepriseService } from "@api/core-domain/infra/services";
import { ownershipRequestRepo } from "@api/core-domain/repo";
import { CreateOwnershipRequest, CreateOwnershipRequestError } from "@api/core-domain/useCases/CreateOwnershipRequest";
import { type NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Handler } from "@api/shared-domain/infra/http/next/Decorators";
import { type UseCaseParameters } from "@common/shared-domain";
import { ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";

type Req = NextController.Req<NextController>;
type Res = NextController.Res<NextController>;

@Handler
export default class OwnershipRequestController implements NextController {
  public async put(req: Req, res: Res) {
    type Input = UseCaseParameters<CreateOwnershipRequest>[0];
    const useCase = new CreateOwnershipRequest(ownershipRequestRepo, entrepriseService);
    const { sirens, emails, askerEmail } = req.body as unknown as Input;

    try {
      const warningsDTO = await useCase.execute({ sirens, emails, askerEmail });
      res.status(StatusCodes.CREATED).json(warningsDTO);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof CreateOwnershipRequestError) {
        if (error.previousError instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ error: error.previousError.message });
        }
        res.status(StatusCodes.BAD_REQUEST).json({
          errorMessage: error
            .appErrorList()
            .map(e => e.message)
            .join(" | "),
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(null);
      }
    }
  }
}
