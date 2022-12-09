import { ownershipRepo } from "@api/core-domain/repo";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";

import type { TokenV1Require } from "./TokenV1Require";
import type { NextControllerMethodDecorator } from "./type";

type SirenController = NextController<"siren">;
type OwnerReq = TokenV1Require.Wrap<EnsureOwner.Wrap<NextController.Req<SirenController>>>;

/**
 * Includes `TokenV1Require`
 */
export const EnsureOwner: NextControllerMethodDecorator<SirenController> = (target, _property, desc) => {
  const originalMethod = desc.value;
  desc.value = (async (req: OwnerReq, res) => {
    req.egapro ??= {} as typeof req.egapro;
    const email = req.egapro.email;
    try {
      const siren = new Siren(req.params.siren);
      const owners = await ownershipRepo.getEmailsAllBySiren(siren);

      if (owners.includes(email)) {
        req.egapro.isOwner = true;
      } else if (owners.length) {
        console.debug(`Non owner (${email}) accessing owned resource ${siren.getValue()}`);

        if (!req.egapro.staff) {
          return res
            .status(StatusCodes.FORBIDDEN)
            .send(`Vous n'avez pas les droits nécessaires pour le siren ${siren.getValue()}`);
        }
      }
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(error.message);
      }
    }

    return originalMethod?.call(target, req, res);
  }) as typeof desc.value;

  return desc;
};

export namespace EnsureOwner {
  export type Wrap<TReq> = TReq & { egapro: { isOwner: boolean } };
}
