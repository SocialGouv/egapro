import { ownershipRepo } from "@api/core-domain/repo";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { StatusCodes } from "http-status-codes";

import type { TokenRequire } from "./TokenRequire";
import type { NextControllerMethodDecorator } from "./type";

type SirenController = NextController<"siren">;
type OwnerReq = TokenRequire.Wrap<EnsureOwner.Wrap<NextController.Req<SirenController>>>;

export const EnsureOwner: NextControllerMethodDecorator<SirenController> = (target, property, desc) => {
  console.warn("EnsureOwner is not implemented.");
  const originalMethod = desc.value;
  desc.value = (async (req: OwnerReq, res) => {
    const email = req.query.email as string;
    const siren = new Siren(req.params.siren);
    const owners = await ownershipRepo.getEmailsAllBySiren(siren);

    if (owners.includes(email)) {
      req.egapro.isOwner = true;
    } else if (owners.length) {
      console.debug(`Non owner (${email}) accessing owned resource ${siren}`);

      if (!req.egapro.staff) {
        return res.status(StatusCodes.FORBIDDEN).send(`Vous n'avez pas les droits nécessaires pour le siren ${siren}`);
      }
    }

    return originalMethod?.call(target, req, res);
  }) as typeof desc.value;

  return desc;
};

export namespace EnsureOwner {
  export type Wrap<TReq> = TReq & { egapro: { isOwner: boolean } };
}
