"use client";

import type { GipPrefillData } from "./shared/gipMdsMapping";
import { Step1Workforce } from "./steps/Step1Workforce";
import { Step2PayGap } from "./steps/Step2PayGap";
import { Step3VariablePay } from "./steps/Step3VariablePay";
import { Step4QuartileDistribution } from "./steps/Step4QuartileDistribution";
import { Step5EmployeeCategories } from "./steps/Step5EmployeeCategories";
import { Step6Review } from "./steps/Step6Review";
import type {
	CategoryData,
	PayGapRow,
	StepCategoryData,
	VariablePayData,
} from "./types";

type StepPageClientProps = {
	step: number;
	declaration: {
		totalWomen: number | null;
		totalMen: number | null;
		status: string | null;
	};
	gipPrefillData?: GipPrefillData;
	step1Categories: CategoryData[];
	step2Rows: PayGapRow[];
	step3Data: VariablePayData;
	step4Categories: StepCategoryData[];
	step5Categories: StepCategoryData[];
};

export function StepPageClient({
	step,
	declaration,
	gipPrefillData,
	step1Categories,
	step2Rows,
	step3Data,
	step4Categories,
	step5Categories,
}: StepPageClientProps) {
	switch (step) {
		case 1:
			return (
				<Step1Workforce
					gipPrefillData={gipPrefillData}
					initialCategories={step1Categories}
				/>
			);
		case 2:
			return (
				<Step2PayGap gipPrefillData={gipPrefillData} initialRows={step2Rows} />
			);
		case 3:
			return (
				<Step3VariablePay
					gipPrefillData={gipPrefillData}
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
					gipPrefillData={gipPrefillData}
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
					isSubmitted={declaration.status === "submitted"}
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
