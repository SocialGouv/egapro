import { z } from "zod";

import { COMPLIANCE_PATHS } from "./steps/compliancePath/constants";

export const updateStep1Schema = z.object({
	totalWomen: z.number().int().min(0),
	totalMen: z.number().int().min(0),
});

export const updateStep2Schema = z.object({
	indicatorAAnnualWomen: z.string().optional(),
	indicatorAAnnualMen: z.string().optional(),
	indicatorAHourlyWomen: z.string().optional(),
	indicatorAHourlyMen: z.string().optional(),
	indicatorCAnnualWomen: z.string().optional(),
	indicatorCAnnualMen: z.string().optional(),
	indicatorCHourlyWomen: z.string().optional(),
	indicatorCHourlyMen: z.string().optional(),
});

export const updateStep3Schema = z.object({
	indicatorBAnnualWomen: z.string().optional(),
	indicatorBAnnualMen: z.string().optional(),
	indicatorBHourlyWomen: z.string().optional(),
	indicatorBHourlyMen: z.string().optional(),
	indicatorDAnnualWomen: z.string().optional(),
	indicatorDAnnualMen: z.string().optional(),
	indicatorDHourlyWomen: z.string().optional(),
	indicatorDHourlyMen: z.string().optional(),
	indicatorEWomen: z.string().optional(),
	indicatorEMen: z.string().optional(),
});

const quartileSchema = z.object({
	threshold: z.string().optional(),
	women: z.number().int().min(0).optional(),
	men: z.number().int().min(0).optional(),
});

export const updateStep4Schema = z.object({
	annual: z.tuple([
		quartileSchema,
		quartileSchema,
		quartileSchema,
		quartileSchema,
	]),
	hourly: z.tuple([
		quartileSchema,
		quartileSchema,
		quartileSchema,
		quartileSchema,
	]),
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
