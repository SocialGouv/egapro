"use client";

import type { GipPrefillData } from "./shared/gipMdsMapping";
import { Step1Workforce } from "./steps/Step1Workforce";
import { Step2PayGap } from "./steps/Step2PayGap";
import { Step3VariablePay } from "./steps/Step3VariablePay";
import { Step4QuartileDistribution } from "./steps/Step4QuartileDistribution";
import { Step5EmployeeCategories } from "./steps/Step5EmployeeCategories";
import { Step6Review } from "./steps/Step6Review";
import type {
	EmployeeCategoryRow,
	Step1Data,
	Step2Data,
	Step3Data,
	Step4Data,
} from "./types";

type StepPageClientProps = {
	step: number;
	declaration: {
		siren: string;
		totalWomen: number | null;
		totalMen: number | null;
		status: string | null;
	};
	gipPrefillData?: GipPrefillData;
	step1Data: Step1Data;
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	step5Categories: EmployeeCategoryRow[];
	initialSource?: string;
};

export function StepPageClient({
	step,
	declaration,
	gipPrefillData,
	step1Data,
	step2Data,
	step3Data,
	step4Data,
	step5Categories,
	initialSource,
}: StepPageClientProps) {
	switch (step) {
		case 1:
			return (
				<Step1Workforce
					gipPrefillData={gipPrefillData}
					initialData={step1Data}
				/>
			);
		case 2:
			return (
				<Step2PayGap gipPrefillData={gipPrefillData} initialData={step2Data} />
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
		case 4:
			return (
				<Step4QuartileDistribution
					gipPrefillData={gipPrefillData}
					initialData={step4Data}
					maxMen={declaration.totalMen ?? undefined}
					maxWomen={declaration.totalWomen ?? undefined}
				/>
			);
		case 5:
			return (
				<Step5EmployeeCategories
					initialCategories={step5Categories}
					initialSource={initialSource}
					maxMen={declaration.totalMen ?? undefined}
					maxWomen={declaration.totalWomen ?? undefined}
				/>
			);
		case 6:
			return (
				<Step6Review
					declaration={declaration}
					isSubmitted={declaration.status === "submitted"}
					step2Data={step2Data}
					step3Data={step3Data}
					step4Data={step4Data}
					step5Categories={step5Categories}
				/>
			);
		default:
			return null;
	}
}
