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
	compliancePath: string | null,
	secondDeclarationStatus: string | null,
	initialCategories: Parameters<typeof hasGapsAboveThreshold>[0],
	correctionCategories: Parameters<typeof hasGapsAboveThreshold>[0],
): ComplianceState {
	if (!hasGapsAboveThreshold(initialCategories)) {
		return { type: "no_gap" };
	}

	const hasSubmittedSecondDeclaration =
		compliancePath === "corrective_action" &&
		secondDeclarationStatus === "submitted";

	if (
		hasSubmittedSecondDeclaration &&
		hasGapsAboveThreshold(correctionCategories)
	) {
		return { type: "second_round" };
	}

	return { type: "first_round" };
}

export async function CompliancePathPage() {
	const session = await auth();
	const data = await api.declaration.getOrCreate();

	if (data.declaration.status !== "submitted") {
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
		data.declaration.compliancePath,
		data.declaration.secondDeclarationStatus,
		initialCategories,
		correctionCategories,
	);

	if (state.type === "no_gap" || data.declaration.complianceCompletedAt) {
		redirect(getPostComplianceDestination(company.hasCse));
	}

	const email = session?.user?.email ?? "";
	const currentYear = data.declaration.year;
	const campaignDeadlines = await getCampaignDeadlines(currentYear);

	return (
		<HydrateClient>
			<CompliancePathChoice
				campaignDeadlines={campaignDeadlines}
				currentYear={currentYear}
				email={email}
				hasCse={company.hasCse}
				initialPath={
					(data.declaration.compliancePath as
						| "justify"
						| "corrective_action"
						| "joint_evaluation"
						| null) ?? undefined
				}
				isSecondRound={state.type === "second_round"}
				pdfDownloadHref={
					state.type === "second_round"
						? "/api/declaration-pdf?type=correction"
						: "/api/declaration-pdf"
				}
			/>
		</HydrateClient>
	);
}
