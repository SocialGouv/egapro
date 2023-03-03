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
export const ZodifiedRoute =
  <TController extends NextController>(
    schema: z.ZodObject<Any>,
    requestProperty: keyof Req,
  ): NextControllerMethodDecorator<TController> =>
  (target, _property, desc) => {
    const originalMethod = desc.value as NonNullable<TController["get"]>;
    desc.value = ((req: Req, res: Res) => {
      const raw = req[requestProperty];
      const propParsed = schema.safeParse(typeof raw === "string" ? JSON.parse(raw) : raw);

      if (!propParsed.success) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(propParsed.error.flatten().fieldErrors);
      }

      req[requestProperty] = propParsed.data as Any;

      return originalMethod?.call(target, req, res);
    }) as typeof desc.value;
  };

export const RouteZodQuery = <TController extends NextController>(
  schema: z.ZodObject<Any>,
): NextControllerMethodDecorator<TController> => ZodifiedRoute(schema, "query");

export const RouteZodBody = <TController extends NextController>(
  schema: z.ZodObject<Any>,
): NextControllerMethodDecorator<TController> => ZodifiedRoute(schema, "body");
