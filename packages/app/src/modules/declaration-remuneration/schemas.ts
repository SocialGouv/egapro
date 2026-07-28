import { z } from "zod";

import { isSexRemunerationComplete } from "~/modules/domain";
import { COMPLIANCE_PATHS } from "./steps/compliancePath/constants";

export const CATEGORY_NAME_MAX_LENGTH = 255;
export const CATEGORY_NAME_MAX_LENGTH_MESSAGE = `${CATEGORY_NAME_MAX_LENGTH} caractères maximum`;

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

const isValidNumericThreshold = (v: string | undefined): v is string =>
	v !== undefined && v !== "" && !Number.isNaN(Number(v));

const quartileWithThresholdSchema = z
	.object({
		threshold: z.string().optional(),
		women: z.number().int().min(0).optional(),
		men: z.number().int().min(0).optional(),
	})
	.refine((q) => isValidNumericThreshold(q.threshold), {
		message: "Le seuil est obligatoire",
	});

const quartileLastSchema = z
	.object({
		threshold: z.string().optional(),
		women: z.number().int().min(0).optional(),
		men: z.number().int().min(0).optional(),
	})
	.refine((q) => !q.threshold, {
		message: "Le 4ème quartile ne doit pas avoir de seuil",
	});

const tableSchema = z
	.tuple([
		quartileWithThresholdSchema,
		quartileWithThresholdSchema,
		quartileWithThresholdSchema,
		quartileLastSchema,
	])
	.refine(
		(q) => {
			const t1 = parseFloat(q[0].threshold as string);
			const t2 = parseFloat(q[1].threshold as string);
			const t3 = parseFloat(q[2].threshold as string);
			return t1 < t2 && t2 < t3;
		},
		{ message: "Les seuils doivent être strictement croissants" },
	);

export const updateStep4Schema = z.object({
	annual: tableSchema,
	hourly: tableSchema,
});

export const PAY_FIELDS_WOMEN = [
	"annualBaseWomen",
	"annualVariableWomen",
	"hourlyBaseWomen",
	"hourlyVariableWomen",
] as const;

export const PAY_FIELDS_MEN = [
	"annualBaseMen",
	"annualVariableMen",
	"hourlyBaseMen",
	"hourlyVariableMen",
] as const;

const employeeCategoryDataSchema = z
	.object({
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
	})
	.refine(
		(data) =>
			isSexRemunerationComplete(
				data.womenCount,
				PAY_FIELDS_WOMEN.map((f) => data[f]),
			) &&
			isSexRemunerationComplete(
				data.menCount,
				PAY_FIELDS_MEN.map((f) => data[f]),
			),
		{
			message:
				"Veuillez renseigner toutes les données de rémunération avant de passer à l'étape suivante.",
		},
	);

export const updateEmployeeCategoriesSchema = z.object({
	declarationType: z.enum(["initial", "correction"]),
	source: z.string().min(1),
	categories: z
		.array(
			z.object({
				name: z
					.string()
					.min(1)
					.max(CATEGORY_NAME_MAX_LENGTH, CATEGORY_NAME_MAX_LENGTH_MESSAGE),
				data: employeeCategoryDataSchema,
			}),
		)
		.max(50),
	referencePeriodStart: z.string().optional(),
	referencePeriodEnd: z.string().optional(),
});

export const categoryFormEntrySchema = z.object({
	name: z
		.string()
		.max(CATEGORY_NAME_MAX_LENGTH, CATEGORY_NAME_MAX_LENGTH_MESSAGE),
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
	source: z
		.string()
		.min(
			1,
			"Veuillez sélectionner la source utilisée pour déterminer les catégories d'emplois.",
		),
	categories: z.array(categoryFormEntrySchema),
});

export const saveCompliancePathSchema = z.object({
	path: z.enum(COMPLIANCE_PATHS),
});

export const acquireLockSchema = z.object({
	declarationId: z.string(),
});

export const heartbeatSchema = z.object({
	declarationId: z.string(),
});

export const releaseLockSchema = z.object({
	declarationId: z.string(),
});

export const getLockStateSchema = z.object({
	declarationId: z.string(),
});
