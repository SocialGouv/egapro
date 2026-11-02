import {
	type DeclarationFsmStatus,
	hasSavedSecondDeclarationData,
} from "~/modules/domain";
import {
	getDemarcheResumeHref,
	getPostComplianceDestination,
} from "~/modules/navigation";
import type { AppHref } from "~/modules/routes";
import {
	FIRST_REMUNERATION_STEP,
	LAST_REMUNERATION_STEP,
	remunerationStepHref,
} from "~/modules/routes";
import { getNextStepHref } from "./funnelSteps";

export type ImpersonationEntryContext = {
	status: DeclarationFsmStatus;
	currentStep: number | null;
	secondDeclarationStep: number | null;
	indicatorGRequired: boolean;
	cseOpinionRequired: boolean;
};

export function getImpersonationEntryHref({
	status,
	currentStep,
	secondDeclarationStep,
	indicatorGRequired,
	cseOpinionRequired,
}: ImpersonationEntryContext): AppHref {
	if (status === "draft") {
		const savedStep = currentStep ?? 0;
		return (
			getNextStepHref(savedStep, indicatorGRequired) ??
			remunerationStepHref(
				savedStep > 0 ? LAST_REMUNERATION_STEP : FIRST_REMUNERATION_STEP,
			)
		);
	}

	return getDemarcheResumeHref(
		status,
		getPostComplianceDestination(cseOpinionRequired),
		hasSavedSecondDeclarationData({ secondDeclarationStep }),
	);
}
