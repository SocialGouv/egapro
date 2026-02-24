"use client";

import {
	Step1Workforce,
	Step2PayGap,
	Step3VariablePay,
	Step4QuartileDistribution,
	Step5EmployeeCategories,
	Step6Review,
} from "~/modules/declaration";
import type {
	CategoryData,
	PayGapRow,
	StepCategoryData,
	VariablePayData,
} from "~/modules/declaration/types";

interface StepPageClientProps {
	step: number;
	declaration: {
		totalWomen: number | null;
		totalMen: number | null;
	};
	step1Categories: CategoryData[];
	step2Rows: PayGapRow[];
	step3Data: VariablePayData;
	step4Categories: StepCategoryData[];
	step5Categories: StepCategoryData[];
}

export function StepPageClient({
	step,
	declaration,
	step1Categories,
	step2Rows,
	step3Data,
	step4Categories,
	step5Categories,
}: StepPageClientProps) {
	switch (step) {
		case 1:
			return <Step1Workforce initialCategories={step1Categories} />;
		case 2:
			return <Step2PayGap initialRows={step2Rows} />;
		case 3:
			return (
				<Step3VariablePay
					initialData={step3Data}
					maxMen={declaration.totalMen ?? undefined}
					maxWomen={declaration.totalWomen ?? undefined}
				/>
			);
		case 4: {
			const annualCats = step4Categories
				.filter((c) => c.name.startsWith("annual:"))
				.map((c) => ({ ...c, name: c.name.replace("annual:", "") }));
			const hourlyCats = step4Categories
				.filter((c) => c.name.startsWith("hourly:"))
				.map((c) => ({ ...c, name: c.name.replace("hourly:", "") }));
			return (
				<Step4QuartileDistribution
					initialAnnualCategories={annualCats.length ? annualCats : undefined}
					initialHourlyCategories={hourlyCats.length ? hourlyCats : undefined}
					maxMen={declaration.totalMen ?? undefined}
					maxWomen={declaration.totalWomen ?? undefined}
				/>
			);
		}
		case 5:
			return (
				<Step5EmployeeCategories
					initialCategories={step5Categories}
					maxMen={declaration.totalMen ?? undefined}
					maxWomen={declaration.totalWomen ?? undefined}
				/>
			);
		case 6:
			return (
				<Step6Review
					step2Rows={step2Rows}
					step3Data={step3Data}
					step4Categories={step4Categories}
					step5Categories={step5Categories}
				/>
			);
		default:
			return null;
	}
}
