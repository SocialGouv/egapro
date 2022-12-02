import { ownershipRepo } from "@api/core-domain/repo";
import type { NextControllerRequest } from "@api/shared-domain/infra/http/impl/NextController";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";

import type { NextControllerMethodDecorator } from "./type";

export const EnsureOwner: NextControllerMethodDecorator = (target, property, desc) => {
  console.warn("EnsureOwner is not implemented.");
  // TODO change ; just for the example
  const originalMethod = desc.value;
  desc.value = (async (req: NextControllerRequest<"siren">, res) => {
    const email = req.query.email as string;
    const siren = new Siren(req.params.siren);
    const owners = await ownershipRepo.getEmailsAllBySiren(siren);

    if (owners.includes(email)) {
      req.query.isOwner = "1";
    } else if (owners.length) {
      console.debug(`Non owner (${email}) accessing owned resource ${siren}`);

      if (!req.query.staff) {
        // TODO
      }
    }

    return originalMethod?.call(target, req, res);
  }) as typeof desc.value;

  return desc;
};
