import { z } from "zod";

export const zodRadioInputSchema = z.union([z.literal("oui"), z.literal("non")]);

const INVALID_PERCENTAGE = "Le champ est requis";

export const zodPercentageSchema = z
  .number({ required_error: INVALID_PERCENTAGE, invalid_type_error: INVALID_PERCENTAGE })
  .nonnegative({ message: "Le pourcentage doit être positif" })
  .lte(100, { message: "Le pourcentage maximum est 100" })
  .multipleOf(0.1, { message: "Le pourcentage n'a au maximum qu'un chiffre après la virgule" })
  .optional();

export type RadioInputValueType = z.infer<typeof zodRadioInputSchema>;

export const radioStringToBool = (radioInput: RadioInputValueType): boolean => radioInput === "oui";

export const radioBoolToString = (value: boolean | undefined): RadioInputValueType | undefined =>
  value === true ? "oui" : value === false ? "non" : undefined;
