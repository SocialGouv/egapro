import { redirect } from "next/navigation";

import {
	formatLongDate,
	getObligationWorkforce,
	isCseOpinionRequired,
	selectJointEvaluationDeadline,
} from "~/modules/domain";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api } from "~/trpc/server";

import { JointEvaluationForm } from "./JointEvaluationForm";

export async function JointEvaluationPage() {
	const data = await api.declaration.getOrCreate();

	const isInitialJoint =
		data.declaration.firstDeclarationPathChoice === "joint_evaluation";
	const isRevisedJoint =
		data.declaration.secondDeclarationPathChoice === "joint_evaluation";

	if (!isInitialJoint && !isRevisedJoint) {
		redirect("/declaration-remuneration/parcours-conformite");
	}

	const [company, existingFile] = await Promise.all([
		api.company.get({ siren: data.declaration.siren }),
		api.jointEvaluation.getFile(),
	]);
	const currentYear = data.declaration.year;
	const campaignDeadlines = await getCampaignDeadlines(currentYear);
	const declarationDate = formatLongDate(
		data.declaration.updatedAt
			? new Date(data.declaration.updatedAt)
			: new Date(),
	);

	return (
		<JointEvaluationForm
			cseOpinionRequired={isCseOpinionRequired({
				workforce: getObligationWorkforce(company.gipWorkforce),
				hasCse: company.hasCse,
			})}
			declarationDate={declarationDate}
			declarationSiren={data.declaration.siren}
			declarationYear={currentYear}
			existingFile={existingFile}
			jointEvaluationDeadline={selectJointEvaluationDeadline(
				campaignDeadlines,
				isRevisedJoint,
			)}
		/>
	);
}
