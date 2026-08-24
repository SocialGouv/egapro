import "server-only";

import { redirect } from "next/navigation";

import { getCurrentYear, parseSiren } from "~/modules/domain";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { getRepresentationCampaign } from "~/server/db/getRepresentationCampaign";
import { api } from "~/trpc/server";

import { CompanyDeclarationsPage } from "./CompanyDeclarationsPage";

type Props = {
	siret: string | null;
	userPhone: string | null;
};

export async function MonEspacePage({ siret, userPhone }: Props) {
	const siren = parseSiren(siret);
	if (siren === null) {
		redirect("/mon-espace/mes-entreprises");
	}
	const currentYear = getCurrentYear();
	const [data, campaignDeadlines, representationCampaign, lockState] =
		await Promise.all([
			api.company.getWithDeclarations({ siren }),
			getCampaignDeadlines(currentYear),
			getRepresentationCampaign(currentYear),
			api.declarationLock.getActiveLockForCurrentDeclaration(),
		]);

	// `getFile` is scoped to the current-year declaration, so it is only safe to call once that row exists.
	const currentDeclaration = data.declarations.find(
		(d) => d.type === "remuneration" && d.year === currentYear,
	);
	const jointEvaluationFile = currentDeclaration?.hasJointEvaluationFile
		? await api.jointEvaluation.getFile()
		: null;

	return (
		<CompanyDeclarationsPage
			campaignDeadlines={campaignDeadlines}
			company={data.company}
			declarations={data.declarations}
			jointEvaluationFile={jointEvaluationFile}
			lockedByOther={lockState.lockedByOther}
			lockHolder={lockState.holder}
			representationCampaign={representationCampaign}
			userPhone={userPhone}
		/>
	);
}
