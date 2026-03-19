import { z } from "zod";

import { COMPLIANCE_PATHS } from "./steps/compliancePath/constants";

export const updateStep1Schema = z.object({
	categories: z.array(
		z.object({
			name: z.string(),
			women: z.number().int().min(0),
			men: z.number().int().min(0),
		}),
	),
});

export const updateStepCategoriesSchema = z.object({
	step: z.number().int().min(2).max(4),
	categories: z.array(
		z.object({
			name: z.string(),
			womenCount: z.number().int().min(0).optional(),
			menCount: z.number().int().min(0).optional(),
			womenValue: z.string().optional(),
			menValue: z.string().optional(),
			womenMedianValue: z.string().optional(),
			menMedianValue: z.string().optional(),
		}),
	),
});

const employeeCategoryDataSchema = z.object({
	womenCount: z.number().int().min(0).optional(),
	menCount: z.number().int().min(0).optional(),
	annualBaseWomen: z.string().optional(),
	annualBaseMen: z.string().optional(),
	annualVariableWomen: z.string().optional(),
	annualVariableMen: z.string().optional(),
	hourlyBaseWomen: z.string().optional(),
	hourlyBaseMen: z.string().optional(),
	hourlyVariableWomen: z.string().optional(),
	hourlyVariableMen: z.string().optional(),
});

export const updateEmployeeCategoriesSchema = z.object({
	declarationType: z.enum(["initial", "correction"]),
	source: z.string().min(1),
	categories: z.array(
		z.object({
			name: z.string().min(1),
			detail: z.string(),
			data: employeeCategoryDataSchema,
		}),
	),
	referencePeriodStart: z.string().optional(),
	referencePeriodEnd: z.string().optional(),
});

export const categoryFormEntrySchema = z.object({
	name: z.string(),
	detail: z.string(),
	womenCount: z.string(),
	menCount: z.string(),
	annualBaseWomen: z.string(),
	annualBaseMen: z.string(),
	annualVariableWomen: z.string(),
	annualVariableMen: z.string(),
	hourlyBaseWomen: z.string(),
	hourlyBaseMen: z.string(),
	hourlyVariableWomen: z.string(),
	hourlyVariableMen: z.string(),
});

export const categoryFormSchema = z.object({
	source: z.string(),
	categories: z.array(categoryFormEntrySchema),
});

export const saveCompliancePathSchema = z.object({
	path: z.enum(COMPLIANCE_PATHS),
});

export const jointEvaluationUploadSchema = z.object({
	fileName: z.string().min(1),
	filePath: z.string().min(1),
});
