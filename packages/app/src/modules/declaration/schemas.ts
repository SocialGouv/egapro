import { z } from "zod";
import { COMPLIANCE_PATHS } from "~/modules/declaration-remuneration/steps/compliancePath/constants";
import { getCurrentYear } from "~/modules/domain";
import { sirenInputSchema } from "~/modules/my-space/schemas";

export const submitDeclarationSchema = z.object({}).optional();

export const saveCompliancePathSchema = z.object({
	path: z.enum(COMPLIANCE_PATHS),
});

export const saveCompliancePathInputSchema = saveCompliancePathSchema;

export type SaveCompliancePathInput = z.infer<typeof saveCompliancePathSchema>;

export const submitSecondDeclarationSchema = z.object({}).optional();

export const submitJointEvaluationSchema = z.object({}).optional();

export const declarationHistoryInputSchema = z.object({
	siren: sirenInputSchema.shape.siren,
	year: z
		.number()
		.int()
		.min(2018)
		.max(getCurrentYear() + 1),
	limit: z.number().int().min(1).max(50).default(10),
	offset: z.number().int().min(0).default(0),
});
