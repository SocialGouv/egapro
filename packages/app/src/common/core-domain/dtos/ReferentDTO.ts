import { COUNTIES_IDS, REGIONS_IDS } from "@common/dict";
import { z } from "zod";

const substituteSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});
const baseReferentSchema = z.object({
  county: z.enum(COUNTIES_IDS).optional(),
  name: z.string(),
  principal: z.boolean().default(false),
  region: z.enum(REGIONS_IDS),
  substitute: substituteSchema.optional(),
});

const emailReferentSchema = baseReferentSchema.extend({
  type: z.literal("email"),
  value: z.string().email(),
});

const urlReferentSchema = baseReferentSchema.extend({
  type: z.literal("url"),
  value: z.string().url(),
});

export const createReferentDTOSchema = z.discriminatedUnion("type", [emailReferentSchema, urlReferentSchema]);
export const referentDTOSchema = createReferentDTOSchema.and(
  z.object({
    id: z.string(),
  }),
);

export type CreateReferentDTO = z.infer<typeof createReferentDTOSchema>;
export type ReferentDTO = z.infer<typeof referentDTOSchema>;
