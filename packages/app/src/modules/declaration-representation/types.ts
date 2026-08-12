import type { z } from "zod";

import type { representationDeclarations } from "~/server/db/schema";
import type {
	executivesSchema,
	membersSchema,
	publicationSchema,
	referencePeriodSchema,
	representationDraftSchema,
	submitRepresentationSchema,
} from "./schemas";

export type RepresentationDeclarationRow =
	typeof representationDeclarations.$inferSelect;

export type ReferencePeriodInput = z.infer<
	ReturnType<typeof referencePeriodSchema>
>;
export type ExecutivesInput = z.infer<typeof executivesSchema>;
export type MembersInput = z.infer<typeof membersSchema>;
export type PublicationInput = z.infer<typeof publicationSchema>;
export type RepresentationDraft = z.infer<typeof representationDraftSchema>;
export type SubmitRepresentationInput = z.infer<
	ReturnType<typeof submitRepresentationSchema>
>;
