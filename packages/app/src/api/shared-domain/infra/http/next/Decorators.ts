import type { NextControllerMethodDecorator } from "@api/shared-domain/infra/http/next/type";
import type { Any } from "@common/utils/types";
import { StatusCodes } from "http-status-codes";
import type { z } from "zod";

import type { NextController } from "../impl/NextController";
import { handler } from "../impl/NextController";

/**
 * Convert a {@link NextController} to nextjs api handler.
 */
export const Handler = <T extends new () => NextController>(target: T) => {
  return handler(new target()) as unknown as T;
};

type Req = NextController.Req<NextController>;
type Res = NextController.Res<NextController>;
export const RouteZodQuery =
  <TController extends NextController>(schema: z.ZodObject<Any>): NextControllerMethodDecorator<TController> =>
  (target, _property, desc) => {
    const originalMethod = desc.value as NonNullable<TController["get"]>;
    desc.value = ((req: Req, res: Res) => {
      const params = schema.safeParse(req.query);

      if (!params.success) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(params.error.flatten().fieldErrors);
      }

      req.query = params.data;

      return originalMethod?.call(target, req, res);
    }) as typeof desc.value;
  };
