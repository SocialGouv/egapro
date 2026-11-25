import { redirect } from "next/navigation";
import {
	type DeclarationFsmStatus,
	getCompliancePathReadOnlyReason,
	getObligationWorkforce,
	hasGapsAboveThreshold,
	isComplianceProcessCompleted,
	isCseOpinionRequired,
	isDraft,
	isSecondDeclarationWritable,
	type LastTransmission,
} from "~/modules/domain";
import { getPostComplianceDestination } from "~/modules/navigation";
import {
	API_DECLARATION_PDF,
	LAST_REMUNERATION_STEP,
	remunerationStepHref,
} from "~/modules/routes";
import { auth } from "~/server/auth";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api, HydrateClient } from "~/trpc/server";
import { CompliancePathChoice } from "./CompliancePathChoice";

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

export function isConcernedDeclarationModifiable(params: {
	isSecondRound: boolean;
	status: DeclarationFsmStatus;
	isFirstDeclarationLocked: boolean;
	lastTransmission: LastTransmission | null;
}): boolean {
	return params.isSecondRound
		? isSecondDeclarationWritable(params.status, params.lastTransmission)
		: !params.isFirstDeclarationLocked;
}

export async function CompliancePathPage() {
	const session = await auth();
	const data = await api.declaration.getOrCreate();

	if (isDraft(data.declaration.status)) {
		redirect(remunerationStepHref(LAST_REMUNERATION_STEP));
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

	const cseOpinionRequired = isCseOpinionRequired({
		workforce: getObligationWorkforce(company.gipWorkforce),
		hasCse: company.hasCse,
	});

	// Skip the page only when there is nothing to (re-)choose: no current gap and
	// no path recorded. A recorded path always reopens the page, including on a
	// completed démarche — a terminal choice stays modifiable until the next
	// campaign (epic #5128).
	if (
		!hasChosenPath &&
		(state.type === "no_gap" ||
			isComplianceProcessCompleted(data.declaration.status))
	) {
		redirect(getPostComplianceDestination(cseOpinionRequired));
	}

	const email = session?.user?.email ?? "";
	const currentYear = data.declaration.year;
	const campaignDeadlines = await getCampaignDeadlines(currentYear);

	const isSecondRound = state.type === "second_round";
	const pathChoice = isSecondRound
		? data.declaration.secondDeclarationPathChoice
		: data.declaration.firstDeclarationPathChoice;
	const gapJustification = isSecondRound
		? data.declaration.secondDeclarationGapJustification
		: data.declaration.firstDeclarationGapJustification;
	const readOnlyReason = getCompliancePathReadOnlyReason({
		status: data.declaration.status,
		pathChoice,
		hasSubmittedSecondDeclaration: data.hasSubmittedSecondDeclaration,
		hasSubmittedCseOpinion: data.hasSubmittedCseOpinion,
		hasSubmittedJointEvaluation: data.hasSubmittedJointEvaluation,
		lastTransmission: data.lastTransmission,
	});

	const declarationModifiable = isConcernedDeclarationModifiable({
		isSecondRound,
		status: data.declaration.status,
		isFirstDeclarationLocked: data.isFirstDeclarationLocked,
		lastTransmission: data.lastTransmission,
	});

	return (
		<HydrateClient>
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				cseOpinionRequired={cseOpinionRequired}
				currentYear={currentYear}
				declarationModifiable={declarationModifiable}
				declarationSiren={data.declaration.siren}
				declarationYear={currentYear}
				email={email}
				initialGapJustification={gapJustification ?? undefined}
				initialPath={pathChoice ?? undefined}
				isSecondRound={isSecondRound}
				pdfDownloadHref={
					isSecondRound
						? `${API_DECLARATION_PDF}?type=correction&year=${currentYear}`
						: `${API_DECLARATION_PDF}?year=${currentYear}`
				}
				readOnlyReason={readOnlyReason ?? undefined}
			/>
		</HydrateClient>
	);
}
