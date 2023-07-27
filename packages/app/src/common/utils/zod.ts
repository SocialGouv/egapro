import { type ValueObject } from "@common/shared-domain";
import { init } from "i18next";
import { z } from "zod";
import { zodI18nMap } from "zod-i18n-map";
// Import your language translation files
import translation from "zod-i18n-map/locales/fr/zod.json";
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

init({
  lng: "fr",
  resources: {
    fr: {
      zod: {
        errors: {
          ...translation.errors,
          invalid_type: "Le champ est requis ou le format est incorrect ",
          required: "Le champ est requis",
        },
      },
    },
  },
});
z.setErrorMap(zodI18nMap);

export const zodFr = z;
