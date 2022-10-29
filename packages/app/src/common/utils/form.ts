import { z } from "zod";

export const zodRadioInputSchema = z.string().transform((val, ctx) => {
  if (val !== "oui" && val !== "non") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le champ est requis",
    });
    return z.NEVER;
  }
  return val;
});

const INVALID_PERCENTAGE = "Le champ est requis";

export const zodPercentageSchema = z
  .string()
  .transform((val, ctx) => {
    const percentage = parseFloat(val);

    if (isNaN(percentage)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: INVALID_PERCENTAGE,
      });
      return z.NEVER;
    }

    if (percentage < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le pourcentage doit être positif",
      });
      return z.NEVER;
    }

    if (percentage > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le pourcentage maximum est 100",
      });
      return z.NEVER;
    }

    const parts = val.split(".");

    if (parts.length > 1 && parts[1].length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le pourcentage n'a au maximum qu'un chiffre après la virgule",
      });
      return z.NEVER;
    }

    return percentage;
  })
  .optional();

export type RadioInputValueType = z.infer<typeof zodRadioInputSchema>;

export const radioStringToBool = (radioInput: RadioInputValueType): boolean => radioInput === "oui";

export const radioBoolToString = (value: boolean | undefined): RadioInputValueType | undefined =>
  value === true ? "oui" : value === false ? "non" : undefined;
