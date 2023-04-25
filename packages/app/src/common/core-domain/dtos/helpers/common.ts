import { COUNTIES_IDS, NAF_SECTIONS, REGIONS_IDS } from "@common/dict";
import { z } from "zod";

export const regionSchema = z.enum(REGIONS_IDS);
export const countySchema = z.enum(COUNTIES_IDS);
export const nafSectionSchema = z.enum(
  Object.keys(NAF_SECTIONS) as [keyof typeof NAF_SECTIONS, ...Array<keyof typeof NAF_SECTIONS>],
);

/**
 * Usually used against searchParams, so have to deal with string inputs exclusively.
 */
export const consultationSchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/)
    .default("10")
    .transform(value => {
      const limit = Number(value);
      return limit > 0 && limit <= 100 ? limit : 10;
    })
    .optional(),
  offset: z
    .string()
    .regex(/^\d+$/)
    .default("0")
    .transform(value => {
      const offset = Number(value);
      return Math.max(offset, 0);
    })
    .optional(),
  countyCode: countySchema.optional(),
  regionCode: regionSchema.optional(),
  nafSection: nafSectionSchema.optional(),
  query: z.string().optional(),
});

export interface ConsultationDTO<T> {
  count: number;
  data: T[];
}
