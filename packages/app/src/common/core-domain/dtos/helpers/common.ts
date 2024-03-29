import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { COUNTIES_IDS, DISPLAY_PUBLIC_YEARS, NAF_SECTIONS, REGIONS_IDS, YEARS, YEARS_REPEQ } from "@common/dict";
import { Percentage } from "@common/shared-domain/domain/valueObjects";
import { type ClearObject } from "@common/utils/types";
import { zodValueObjectSuperRefine } from "@common/utils/zod";
import { z } from "zod";

export const regionSchema = z.enum(REGIONS_IDS);
export const countySchema = z.enum(COUNTIES_IDS);
export const nafSectionSchema = z.enum(
  Object.keys(NAF_SECTIONS) as [keyof typeof NAF_SECTIONS, ...Array<keyof typeof NAF_SECTIONS>],
);
export const displayPublicYearCoerciveSchema = z.coerce
  .number()
  .refine(
    year => DISPLAY_PUBLIC_YEARS.includes(year),
    `L'année doit être incluse dans la liste ${DISPLAY_PUBLIC_YEARS.join(", ")}`,
  );

export const yearCoerciveSchema = z.coerce
  .number()
  .refine(year => YEARS.includes(year), `L'année doit être incluse dans la liste ${YEARS.join(", ")}`);

export const sirenSchema = z.string().superRefine(zodValueObjectSuperRefine(Siren));

export const percentageSchema = z
  .number({ invalid_type_error: "Le pourcentage est requis et doit être valide" })
  .nonnegative("Le pourcentage ne peut pas être inférieur à 0")
  .lte(100, "Le pourcentage ne peut pas être supérieur à 100%")
  .superRefine(zodValueObjectSuperRefine(Percentage));

export const repeqYearSchema = z
  .number()
  .refine(
    val => YEARS_REPEQ.includes(val),
    `L'année de déclaration doit être l'une des suivantes : ${YEARS_REPEQ.join(", ")}`,
  );

/**
 * Usually used against searchParams, so have to deal with string inputs exclusively.
 */
export const searchSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  page: z.coerce.number().min(0).default(0),
});

export const consultationSchema = z.object({
  query: z.string().optional(),
  countyCode: countySchema.optional(),
  regionCode: regionSchema.optional(),
  nafSection: nafSectionSchema.optional(),
});

export const searchConsultationSchema = consultationSchema.and(searchSchema);

export type SearchInput = z.input<typeof searchSchema>;
export type ConsultationInput = z.input<typeof consultationSchema>;
export type SearchConsultationDTO = ClearObject<z.infer<typeof searchConsultationSchema>>;

export interface ConsultationDTO<T> {
  count: number;
  data: T[];
}
