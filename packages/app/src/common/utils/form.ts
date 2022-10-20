import { z } from "zod";

export const zodRadioInputSchema = z.union([z.literal("oui"), z.literal("non")]);

export const zodPercentageSchema = z
  .number()
  .nonnegative({ message: "Le pourcentage doit être positif" })
  .lte(100, { message: "Le pourcentage maximum est 100" })
  .optional();

export type RadioInputValueType = z.infer<typeof zodRadioInputSchema>;

export const radioStringToBool = (radioInput: RadioInputValueType): boolean => radioInput === "oui";

export const radioBoolToString = (value: boolean | undefined): RadioInputValueType => (value ? "oui" : "non");
