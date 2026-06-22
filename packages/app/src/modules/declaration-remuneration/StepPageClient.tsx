"use client";

import { useMemo } from "react";
import { useFunnelTracking } from "~/modules/analytics";
import { getCompanySizeRange } from "~/modules/domain";
import {
	DECLARATION_FUNNEL,
	declarationFunnelDimensions,
} from "./shared/funnelConfig";
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
		year: number;
		totalWomen: number | null;
		totalMen: number | null;
		status: string | null;
	};
	// Official GIP/DSN workforce on the company — the canonical source for every
	// size-based decision. Used here only to bucket the Matomo funnel dimension,
	// so analytics segments match the business logic (never the self-reported
	// `totalWomen + totalMen`, which may differ or be empty early in the funnel).
	companyWorkforce: number | null;
	gipPrefillData?: GipPrefillData;
	step1Data: Step1Data;
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	step5Categories: EmployeeCategoryRow[];
	initialSource?: string;
	hasCse?: boolean | null;
};

export function StepPageClient({
	step,
	declaration,
	companyWorkforce,
	gipPrefillData,
	step1Data,
	step2Data,
	step3Data,
	step4Data,
	step5Categories,
	initialSource,
	hasCse = null,
}: StepPageClientProps) {
	const sizeRange =
		companyWorkforce !== null
			? getCompanySizeRange(companyWorkforce)
			: undefined;

	const dimensions = useMemo(
		() => declarationFunnelDimensions(declaration.year, sizeRange),
		[declaration.year, sizeRange],
	);
	useFunnelTracking(DECLARATION_FUNNEL, { step, dimensions });

	switch (step) {
		case 1:
			return (
				<Step1Workforce
					declarationSiren={declaration.siren}
					declarationYear={declaration.year}
					gipPrefillData={gipPrefillData}
					initialData={step1Data}
				/>
			);
		case 2:
			return (
				<Step2PayGap
					declarationSiren={declaration.siren}
					declarationYear={declaration.year}
					gipPrefillData={gipPrefillData}
					initialData={step2Data}
				/>
			);
		case 3:
			return (
				<Step3VariablePay
					declarationSiren={declaration.siren}
					declarationYear={declaration.year}
					gipPrefillData={gipPrefillData}
					initialData={step3Data}
					maxMen={declaration.totalMen ?? undefined}
					maxWomen={declaration.totalWomen ?? undefined}
				/>
			);
		case 4:
			return (
				<Step4QuartileDistribution
					declarationSiren={declaration.siren}
					declarationYear={declaration.year}
					gipPrefillData={gipPrefillData}
					initialData={step4Data}
					maxMen={declaration.totalMen ?? undefined}
					maxWomen={declaration.totalWomen ?? undefined}
				/>
			);
		case 5:
			return (
				<Step5EmployeeCategories
					declarationSiren={declaration.siren}
					declarationYear={declaration.year}
					initialCategories={step5Categories}
					initialSource={initialSource}
					maxMen={declaration.totalMen ?? undefined}
					maxWomen={declaration.totalWomen ?? undefined}
				/>
			);
		case 6:
			return (
				<Step6Review
					companyWorkforce={companyWorkforce}
					declaration={declaration}
					declarationYear={declaration.year}
					hasCse={hasCse}
					isSubmitted={
						declaration.status !== null && declaration.status !== "draft"
					}
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
