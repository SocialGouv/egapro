import { COUNTIES_IDS, REGIONS_IDS } from "@common/dict";
import { z } from "zod";

const substituteSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});
const baseReferentSchema = z.object({
  county: z.enum(COUNTIES_IDS).optional(),
  name: z.string().min(1),
  principal: z.boolean().default(false),
  region: z.enum(REGIONS_IDS),
  substitute: substituteSchema.optional(),
});
const emailReferentSubSchema = {
  type: z.literal("email"),
  value: z.string().email(),
};
const emailReferentSchema = baseReferentSchema.extend(emailReferentSubSchema);
const emailReferentPartialSchema = baseReferentSchema.partial().extend(emailReferentSubSchema);

const urlReferentSubSchema = {
  type: z.literal("url"),
  value: z.string().url(),
};
const urlReferentSchema = baseReferentSchema.extend(urlReferentSubSchema);
const urlReferentPartialSchema = baseReferentSchema.partial().extend(urlReferentSubSchema);

export const createReferentDTOSchema = z.discriminatedUnion("type", [emailReferentSchema, urlReferentSchema]);
export const referentDTOSchema = createReferentDTOSchema.and(
  z.object({
    id: z.string(),
  }),
);
export const editReferentDTOSchema = z
  .discriminatedUnion("type", [emailReferentPartialSchema, urlReferentPartialSchema])
  .and(
    z.object({
      id: z.string(),
    }),
  );

export type CreateReferentDTO = z.infer<typeof createReferentDTOSchema>;
export type ReferentDTO = z.infer<typeof referentDTOSchema>;
export type EditReferentDTO = z.infer<typeof editReferentDTOSchema>;
