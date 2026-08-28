import type { z } from "zod";

import type { representationDeclarations } from "~/server/db/schema";
import type {
	executivesSchema,
	membersSchema,
	publicationSchema,
	referencePeriodSchema,
	representationDraftSchema,
	subjectionSchema,
	submitRepresentationSchema,
} from "./schemas";

export type RepresentationDeclarationRow = Omit<
	typeof representationDeclarations.$inferSelect,
	"legacyDeclarant" | "importedFromV1At"
>;

export type ReferencePeriodInput = z.infer<
	ReturnType<typeof referencePeriodSchema>
>;
export type SubjectionAnswer = NonNullable<
	z.infer<typeof subjectionSchema>["answer"]
>;
export type ExecutivesInput = z.infer<typeof executivesSchema>;
export type MembersInput = z.infer<typeof membersSchema>;
export type PublicationInput = z.infer<typeof publicationSchema>;
export type RepresentationDraft = z.infer<typeof representationDraftSchema>;
export type SubmitRepresentationInput = z.infer<
	ReturnType<typeof submitRepresentationSchema>
>;

export const TOTAL_REPRESENTATION_STEPS = 5;

export const REPRESENTATION_STEP_SLUGS = [
	"periode-de-reference",
	"ecarts-cadres-dirigeants",
	"ecarts-instances-dirigeantes",
	"informations-de-publication",
	"recapitulatif",
] as const;

export type RepresentationStepSlug = (typeof REPRESENTATION_STEP_SLUGS)[number];
