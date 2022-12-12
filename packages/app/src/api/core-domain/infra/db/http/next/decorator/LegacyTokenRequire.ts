import type { NextController } from "@api/shared-domain/infra/http/impl/NextController";
import { config } from "@common/config";
import { AppError } from "@common/shared-domain";
import { StatusCodes } from "http-status-codes";
import type { Algorithm, JwtPayload } from "jsonwebtoken";
import { JsonWebTokenError, TokenExpiredError, verify as jwtVerify } from "jsonwebtoken";

import type { NextControllerMethodDecorator } from "./type";

class LegacyTokenRequireError extends AppError {}

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

type TokenReq = LegacyTokenRequire.Wrap<NextController.Req<NextController>>;

/**
 * Verify a token from "v1" API and returns {@link StatusCodes.UNAUTHORIZED} if not valid.
 */
export const LegacyTokenRequire: NextControllerMethodDecorator = (target, property, desc) => {
  const originalMethod = desc.value;
  desc.value = (async (req: TokenReq, res) => {
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
    } catch (error: unknown) {
      console.debug(`Invalid token on ${req._req.url} (token: ${token}, referrer: ${req._req.headers.referer})`, error);
      return res.status(StatusCodes.UNAUTHORIZED).send("Invalid token");
    }

    return originalMethod?.call(target, req, res);
  }) as typeof desc.value;

  return desc;
};

export namespace LegacyTokenRequire {
  export type Wrap<TReq> = TReq & { egapro: { email: string; staff: boolean } };
}