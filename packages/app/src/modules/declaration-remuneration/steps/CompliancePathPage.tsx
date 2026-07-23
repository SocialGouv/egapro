import { redirect } from "next/navigation";
import {
	type DeclarationFsmStatus,
	hasGapsAboveThreshold,
	isComplianceProcessCompleted,
	isDeadlinePassed,
	isDraft,
} from "~/modules/domain";
import { auth } from "~/server/auth";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api, HydrateClient } from "~/trpc/server";
import { getPostComplianceDestination } from "../shared/complianceNavigation";
import { CompliancePathChoice } from "./CompliancePathChoice";
import type {
	CompliancePathReadOnlyReason,
	CompliancePathValue,
} from "./compliancePath/constants";

type ComplianceState =
	| { type: "no_gap" }
	| { type: "first_round" }
	| { type: "second_round" };

export function getComplianceState(
	firstDeclarationPathChoice: string | null,
	hasSubmittedSecondDeclaration: boolean,
	initialCategories: Parameters<typeof hasGapsAboveThreshold>[0],
	correctionCategories: Parameters<typeof hasGapsAboveThreshold>[0],
): ComplianceState {
	if (!hasGapsAboveThreshold(initialCategories)) {
		return { type: "no_gap" };
	}

	const hasFinalisedFirstRound =
		firstDeclarationPathChoice === "corrective_action" &&
		hasSubmittedSecondDeclaration;

	if (hasFinalisedFirstRound && hasGapsAboveThreshold(correctionCategories)) {
		return { type: "second_round" };
	}

	return { type: "first_round" };
}

export function getCompliancePathReadOnlyReason(params: {
	status: DeclarationFsmStatus;
	pathChoice: CompliancePathValue | null;
	hasSubmittedSecondDeclaration: boolean;
	hasSubmittedCseOpinion: boolean;
	hasSubmittedJointEvaluation: boolean;
	pathChoiceDeadline: Date;
	now?: Date;
}): CompliancePathReadOnlyReason | null {
	const {
		status,
		pathChoice,
		hasSubmittedSecondDeclaration,
		hasSubmittedCseOpinion,
		hasSubmittedJointEvaluation,
		pathChoiceDeadline,
		now,
	} = params;

	if (isComplianceProcessCompleted(status)) return "demarche_completed";
	if (pathChoice === "justify" && hasSubmittedCseOpinion)
		return "cse_opinion_submitted";
	if (pathChoice === "corrective_action" && hasSubmittedSecondDeclaration)
		return "second_declaration_submitted";
	if (pathChoice === "joint_evaluation" && hasSubmittedJointEvaluation)
		return "joint_evaluation_submitted";
	if (isDeadlinePassed(pathChoiceDeadline, now))
		return "path_choice_deadline_passed";
	return null;
}

export async function CompliancePathPage() {
	const session = await auth();
	const data = await api.declaration.getOrCreate();

	if (isDraft(data.declaration.status)) {
		redirect("/declaration-remuneration/etape/6");
	}

	const company = await api.company.get({ siren: data.declaration.siren });

	const initialCategories = data.employeeCategories.filter(
		(c) => c.declarationType === "initial",
	);
	const correctionCategories = data.employeeCategories.filter(
		(c) => c.declarationType === "correction",
	);

	const state = getComplianceState(
		data.declaration.firstDeclarationPathChoice,
		data.hasSubmittedSecondDeclaration,
		initialCategories,
		correctionCategories,
	);

	const hasChosenPath = data.declaration.firstDeclarationPathChoice !== null;

	// Skip the choice page only when the user has nothing to (re-)choose:
	// no current gap and they never picked a path, or they finalised the
	// procedure without one. When firstDeclarationPathChoice is set, render
	// the choice page so the user can review what they picked — the FSM
	// rejects mutations from demarche_completed, so toggling is harmless.
	if (
		!hasChosenPath &&
		(state.type === "no_gap" ||
			isComplianceProcessCompleted(data.declaration.status))
	) {
		redirect(getPostComplianceDestination(company.hasCse));
	}

	const email = session?.user?.email ?? "";
	const currentYear = data.declaration.year;
	const campaignDeadlines = await getCampaignDeadlines(currentYear);

	const isSecondRound = state.type === "second_round";
	const pathChoice = isSecondRound
		? data.declaration.secondDeclarationPathChoice
		: data.declaration.firstDeclarationPathChoice;
	const readOnlyReason = getCompliancePathReadOnlyReason({
		status: data.declaration.status,
		pathChoice,
		hasSubmittedSecondDeclaration: data.hasSubmittedSecondDeclaration,
		hasSubmittedCseOpinion: data.hasSubmittedCseOpinion,
		hasSubmittedJointEvaluation: data.hasSubmittedJointEvaluation,
		pathChoiceDeadline: campaignDeadlines.pathChoiceDeadline,
	});

	return (
		<HydrateClient>
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={currentYear}
				declarationSiren={data.declaration.siren}
				declarationYear={currentYear}
				email={email}
				hasCse={company.hasCse}
				initialPath={pathChoice ?? undefined}
				isSecondRound={isSecondRound}
				pdfDownloadHref={
					isSecondRound
						? `/api/declaration-pdf?type=correction&year=${currentYear}`
						: `/api/declaration-pdf?year=${currentYear}`
				}
				readOnlyReason={readOnlyReason ?? undefined}
			/>
		</HydrateClient>
	);
}
