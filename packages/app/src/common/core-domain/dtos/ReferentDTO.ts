import { COUNTIES_IDS, REGIONS_IDS } from "@common/dict";
import { z } from "zod";

const baseReferentSchema = z.object({
  county: z.enum(COUNTIES_IDS).optional(),
  id: z.string(),
  name: z.string(),
  principal: z.boolean().default(false),
  region: z.enum(REGIONS_IDS),
});

const emailReferentSchema = baseReferentSchema.extend({
  type: z.literal("email"),
  value: z.string().email(),
});

const urlReferentSchema = baseReferentSchema.extend({
  type: z.literal("url"),
  value: z.string().url(),
});

export const referentDTOSchema = z.discriminatedUnion("type", [emailReferentSchema, urlReferentSchema]);

export type ReferentDTO = z.infer<typeof referentDTOSchema>;
