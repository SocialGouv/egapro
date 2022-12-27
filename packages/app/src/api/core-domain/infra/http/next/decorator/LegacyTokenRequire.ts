import { ownershipRepo } from "@api/core-domain/repo";
import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { config } from "@common/config";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { AppError, ValidationError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";
import type { Algorithm, JwtPayload } from "jsonwebtoken";
import { JsonWebTokenError, TokenExpiredError, verify as jwtVerify } from "jsonwebtoken";

import type { NextControllerMethodDecorator } from "../../../../../shared-domain/infra/http/next/type";

class LegacyTokenRequireError extends AppError {}
class LegacyTokenRequireNonOwnerError extends AppError {}

/**
 * JWT handling for readonly cross api tokens
 */
const readToken = (token: string) => {
  try {
    const decoded = jwtVerify(token, config.api.security.jwtv1.secret, {
      algorithms: [config.api.security.jwtv1.algorithm as Algorithm],
    }) as JwtPayload;

    const email = decoded.sub;

    if (!email) throw new LegacyTokenRequireError("No email found in token.");

    return email.toLowerCase();
  } catch (error: unknown) {
    if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
      throw new LegacyTokenRequireError(error.message, error);
    } else throw error;
  }
};

/**
 * Ensure given logged user is "owner" of the Siren in an asked resource.
 */
const checkOwner = async (siren: Siren, email: string, isStaff: boolean) => {
  const owners = await ownershipRepo.getEmailsAllBySiren(siren);

  if (owners.includes(email)) {
    return true;
  } else if (owners.length) {
    console.debug(`Non owner (${email}) accessing owned resource ${siren.getValue()}`);

    if (!isStaff) {
      throw new LegacyTokenRequireNonOwnerError(
        `Vous n'avez pas les droits nécessaires pour le siren ${siren.getValue()}`,
      );
    }
  }
  return false;
};

type TokenReq = LegacyTokenRequire.Wrap<NextController.Req<NextController>>;
type Res = NextController.Res<NextController>;
type SirenController = NextController<"siren">;

export interface LegacyTokenRequireOptions {
  /**
   * Ensure that given route siren is owned by logged email.
   *
   * 💡 Make sure that the controller implements `NextController<"siren">`.
   */
  ensureOwner?: true;
  /**
   * Prevent non staff from accessing this route.
   */
  staffOnly?: true;
}

/**
 * Verify a token from "v1" API and returns {@link StatusCodes.UNAUTHORIZED} if not valid.
 */
export const LegacyTokenRequire =
  <
    T extends LegacyTokenRequireOptions,
    TController extends T extends { ensureOwner: true } ? SirenController : NextController,
  >(
    { staffOnly, ensureOwner } = {} as T,
  ): NextControllerMethodDecorator<TController> =>
  (target, _property, desc) => {
    const originalMethod = desc.value as NonNullable<TController["get"]>;
    desc.value = (async (req: TokenReq, res: Res) => {
      req.egapro ??= {} as typeof req.egapro;
      const token = req._req.headers["API-KEY"] ?? req._req.headers["api-key"];

      if (!token || typeof token !== "string") {
        console.debug(`Request without token on ${req._req.url}`);
        return res.status(StatusCodes.UNAUTHORIZED).send("No authentication token was provided.");
      }

      try {
        const email = readToken(token);

        req.egapro.email = email;
        req.egapro.staff = config.api.staff.includes(email);

        if (staffOnly && !req.egapro.staff) {
          return res.status(StatusCodes.UNAUTHORIZED).send("Staff only.");
        }

        if (ensureOwner) {
          req.egapro.isOwner = await checkOwner(new Siren(req.params.siren), email, req.egapro.staff);
        }
      } catch (error: unknown) {
        if (error instanceof ValidationError) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(error.message);
        } else if (error instanceof LegacyTokenRequireNonOwnerError) {
          return res.status(StatusCodes.FORBIDDEN).send(error.message);
        }

        console.debug(
          `Invalid token on ${req._req.url} (token: ${token}, referrer: ${req._req.headers.referer})`,
          error,
        );
        return res.status(StatusCodes.UNAUTHORIZED).send("Invalid token");
      }

      return originalMethod?.call(target, req, res);
    }) as typeof desc.value;

    return desc;
  };

export namespace LegacyTokenRequire {
  export type Wrap<TReq> = TReq & { egapro: { email: string; isOwner: boolean; staff: boolean } };
}
