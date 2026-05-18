import { z } from "zod";
import { COMPLIANCE_PATHS } from "~/modules/declaration-remuneration/steps/compliancePath/constants";

export const submitDeclarationSchema = z.object({}).optional();

export const saveCompliancePathSchema = z.object({
	path: z.enum(COMPLIANCE_PATHS),
});

export const saveCompliancePathInputSchema = saveCompliancePathSchema;

export type SaveCompliancePathInput = z.infer<typeof saveCompliancePathSchema>;

export const submitSecondDeclarationSchema = z.object({}).optional();

export const submitJointEvaluationSchema = z.object({}).optional();
