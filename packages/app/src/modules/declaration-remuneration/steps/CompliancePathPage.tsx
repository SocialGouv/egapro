import { redirect } from "next/navigation";
import { hasGapsAboveThreshold } from "~/modules/domain";
import { auth } from "~/server/auth";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api, HydrateClient } from "~/trpc/server";
import { getPostComplianceDestination } from "../shared/complianceNavigation";
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

export async function CompliancePathPage() {
	const session = await auth();
	const data = await api.declaration.getOrCreate();

	if (data.declaration.status === "draft") {
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
			data.declaration.status === "demarche_completed")
	) {
		redirect(getPostComplianceDestination(company.hasCse));
	}

	const email = session?.user?.email ?? "";
	const currentYear = data.declaration.year;
	const campaignDeadlines = await getCampaignDeadlines(currentYear);
	// The FSM only accepts choose_compliance_path from awaiting_compliance_
	// path_choice / awaiting_revision_choice. Any other state means the user
	// has moved past their choice — render the page as read-only.
	const isReadOnly =
		data.declaration.status !== "awaiting_compliance_path_choice" &&
		data.declaration.status !== "awaiting_revision_choice";

	return (
		<HydrateClient>
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={currentYear}
				declarationSiren={data.declaration.siren}
				declarationYear={currentYear}
				email={email}
				initialPath={data.declaration.firstDeclarationPathChoice ?? undefined}
				isReadOnly={isReadOnly}
				isSecondRound={state.type === "second_round"}
				pdfDownloadHref={
					state.type === "second_round"
						? `/api/declaration-pdf?type=correction&year=${currentYear}`
						: `/api/declaration-pdf?year=${currentYear}`
				}
			/>
		</HydrateClient>
	);
}
