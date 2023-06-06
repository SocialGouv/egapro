import { type ValueObject } from "@common/shared-domain";
import { z } from "zod";

/**
 * Allow direct usage of value objects in zod superRefine function.
 *
 * Handle (for now) only "simple" value object with direct single constructor parameter.
 */
export const zodValueObjectSuperRefine =
  <TType, T extends new (value: TType) => ValueObject<TType>>(voClass: T, message?: string) =>
  (refinement: TType, ctx: z.RefinementCtx) => {
    try {
      new voClass(refinement);
    } catch (error: unknown) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: message ?? (error as Error).message,
      });
    }
  };
