import { z } from "zod";

import { employeeCategoryInputSchema } from "~/modules/declaration-remuneration/schemas";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";

// Re-opening a closed démarche stages the edit instead of overwriting the
// transmitted data: it only becomes canonical when the déposant transmits
// again. These slices live in `declarations.draft` like any other draft.
export const STAGED_SECOND_DECLARATION_KIND = "second";
export const STAGED_SECOND_DECLARATION_STEP = "second-categories";
export const STAGED_JOINT_UPLOAD_KIND = "joint";
export const STAGED_JOINT_UPLOAD_STEP = "upload";

export const stagedSecondDeclarationSchema = z.object({
	source: z.string().min(1),
	categories: z.array(employeeCategoryInputSchema).min(1),
	referencePeriodStart: z.string().optional(),
	referencePeriodEnd: z.string().optional(),
});

export type StagedSecondDeclaration = z.infer<
	typeof stagedSecondDeclarationSchema
>;

export const stagedJointUploadSchema = z.object({
	fileId: z.string().min(1),
	fileName: z.string().min(1),
	filePath: z.string().min(1),
	uploadedAt: z.string(),
});

export type StagedJointUpload = z.infer<typeof stagedJointUploadSchema>;

function readSlice(draft: unknown, kind: string, step: string): unknown {
	if (draft === null || typeof draft !== "object") return undefined;
	const kindData = (draft as Record<string, unknown>)[kind];
	if (kindData === null || typeof kindData !== "object") return undefined;
	return (kindData as Record<string, unknown>)[step];
}

export function parseStagedSecondDeclaration(
	draft: unknown,
): StagedSecondDeclaration | null {
	const parsed = stagedSecondDeclarationSchema.safeParse(
		readSlice(
			draft,
			STAGED_SECOND_DECLARATION_KIND,
			STAGED_SECOND_DECLARATION_STEP,
		),
	);
	return parsed.success ? parsed.data : null;
}

export function parseStagedJointUpload(
	draft: unknown,
): StagedJointUpload | null {
	const parsed = stagedJointUploadSchema.safeParse(
		readSlice(draft, STAGED_JOINT_UPLOAD_KIND, STAGED_JOINT_UPLOAD_STEP),
	);
	return parsed.success ? parsed.data : null;
}

export function toEmployeeCategoryRows(
	categories: StagedSecondDeclaration["categories"],
): EmployeeCategoryRow[] {
	return categories.map((category) => ({
		name: category.name,
		womenCount: category.data.womenCount ?? null,
		menCount: category.data.menCount ?? null,
		hourlyWomenCount: category.data.hourlyWomenCount ?? null,
		hourlyMenCount: category.data.hourlyMenCount ?? null,
		annualBaseWomen: category.data.annualBaseWomen ?? null,
		annualBaseMen: category.data.annualBaseMen ?? null,
		annualVariableWomen: category.data.annualVariableWomen ?? null,
		annualVariableMen: category.data.annualVariableMen ?? null,
		hourlyBaseWomen: category.data.hourlyBaseWomen ?? null,
		hourlyBaseMen: category.data.hourlyBaseMen ?? null,
		hourlyVariableWomen: category.data.hourlyVariableWomen ?? null,
		hourlyVariableMen: category.data.hourlyVariableMen ?? null,
	}));
}
