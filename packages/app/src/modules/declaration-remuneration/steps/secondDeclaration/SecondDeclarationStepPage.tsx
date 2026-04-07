import { notFound, redirect } from "next/navigation";

import { shouldRedirectSubmittedToRecap } from "~/modules/domain";
import { mapToEmployeeCategoryRows } from "~/server/api/routers/declarationHelpers";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api, HydrateClient } from "~/trpc/server";
import { SECOND_DECLARATION_TOTAL_STEPS } from "./constants";
import { SecondDeclarationStep1Info } from "./SecondDeclarationStep1Info";
import { SecondDeclarationStep2Form } from "./SecondDeclarationStep2Form";
import { SecondDeclarationStep3Review } from "./SecondDeclarationStep3Review";

type Props = {
	step: number;
};

export async function SecondDeclarationStepPage({ step }: Props) {
	if (Number.isNaN(step) || step < 1 || step > SECOND_DECLARATION_TOTAL_STEPS) {
		notFound();
	}

	const data = await api.declaration.getOrCreate();
	const company = await api.company.get({ siren: data.declaration.siren });
	const currentYear = data.declaration.year;
	const campaignDeadlines = await getCampaignDeadlines(currentYear);

	// If the second declaration is submitted AND the modification deadline has
	// passed, lock editing by redirecting non-recap steps to the recap.
	if (
		shouldRedirectSubmittedToRecap({
			status: data.declaration.secondDeclarationStatus,
			step,
			recapStep: 3,
			modificationDeadline: campaignDeadlines.decl2ModificationDeadline,
		})
	) {
		redirect("/declaration-remuneration/parcours-conformite/etape/3");
	}

	const initialCategories = mapToEmployeeCategoryRows(
		data.jobCategories,
		data.employeeCategories,
		"initial",
	);

	const hasCorrectionData = data.employeeCategories.some(
		(e) => e.declarationType === "correction",
	);
	const correctionCategories = hasCorrectionData
		? mapToEmployeeCategoryRows(
				data.jobCategories,
				data.employeeCategories,
				"correction",
			)
		: [];

	const initialSource = data.jobCategories[0]?.source;

	const declarationDate = data.declaration.updatedAt
		? new Date(data.declaration.updatedAt).toLocaleDateString("fr-FR")
		: new Date().toLocaleDateString("fr-FR");

	if (step === 1) {
		return (
			<SecondDeclarationStep1Info
				declarationDate={declarationDate}
				modificationDeadline={campaignDeadlines.decl2ModificationDeadline}
			/>
		);
	}

	if (step === 2) {
		return (
			<HydrateClient>
				<SecondDeclarationStep2Form
					declarationYear={currentYear}
					initialEndDate={
						data.declaration.secondDeclReferencePeriodEnd ?? undefined
					}
					initialFirstDeclarationCategories={initialCategories}
					initialSecondDeclarationCategories={
						correctionCategories.length > 0 ? correctionCategories : undefined
					}
					initialSource={initialSource}
					initialStartDate={
						data.declaration.secondDeclReferencePeriodStart ?? undefined
					}
				/>
			</HydrateClient>
		);
	}

	// step === 3
	const reviewCategories =
		correctionCategories.length > 0 ? correctionCategories : initialCategories;

	return (
		<HydrateClient>
			<SecondDeclarationStep3Review
				declarationYear={currentYear}
				hasCse={company.hasCse}
				secondDeclarationCategories={reviewCategories}
				siren={data.declaration.siren}
			/>
		</HydrateClient>
	);
}
