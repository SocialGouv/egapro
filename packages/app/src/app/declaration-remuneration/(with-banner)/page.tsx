import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getImpersonationEntryHref } from "~/modules/declaration-remuneration";
import {
	getObligationWorkforce,
	isCseOpinionRequired,
	isIndicatorGRequiredForGip,
} from "~/modules/domain";
import {
	FIRST_REMUNERATION_STEP,
	remunerationStepHref,
} from "~/modules/routes";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
	title: "Déclaration des écarts de rémunération",
};

export default async function DeclarationPage() {
	const session = await auth();
	if (!session?.user.impersonation) {
		redirect(remunerationStepHref(FIRST_REMUNERATION_STEP));
	}

	const { declaration } = await api.declaration.getOrCreate();
	const company = await api.company.get({ siren: declaration.siren });

	redirect(
		getImpersonationEntryHref({
			status: declaration.status,
			currentStep: declaration.currentStep,
			secondDeclarationStep: declaration.secondDeclarationStep,
			indicatorGRequired: isIndicatorGRequiredForGip(
				company.gipWorkforce,
				declaration.year,
			),
			cseOpinionRequired: isCseOpinionRequired({
				workforce: getObligationWorkforce(company.gipWorkforce),
				hasCse: company.hasCse,
			}),
		}),
	);
}
