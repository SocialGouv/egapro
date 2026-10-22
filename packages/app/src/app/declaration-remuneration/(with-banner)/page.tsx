import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getNextStepHref } from "~/modules/declaration-remuneration";
import {
	getObligationWorkforce,
	isCseOpinionRequired,
	isIndicatorGRequiredForGip,
} from "~/modules/domain";
import { getCurrentStageHref } from "~/modules/navigation";
import {
	FIRST_REMUNERATION_STEP,
	LAST_REMUNERATION_STEP,
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
	if (declaration.status === "draft") {
		const currentStep = declaration.currentStep ?? 0;
		const nextSavedStep = getNextStepHref(
			currentStep,
			isIndicatorGRequiredForGip(company.gipWorkforce, declaration.year),
		);
		redirect(
			nextSavedStep ??
				remunerationStepHref(
					currentStep > 0 ? LAST_REMUNERATION_STEP : FIRST_REMUNERATION_STEP,
				),
		);
	}

	const cseOpinionRequired = isCseOpinionRequired({
		workforce: getObligationWorkforce(company.gipWorkforce),
		hasCse: company.hasCse,
	});

	redirect(getCurrentStageHref(declaration.status, cseOpinionRequired));
}
