import { redirect } from "next/navigation";

import {
	getObligationWorkforce,
	isCseOpinionRequired,
	selectJointEvaluationDeadline,
} from "~/modules/domain";
import { COMPLIANCE_PATH } from "~/modules/routes";
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
		redirect(COMPLIANCE_PATH);
	}

	const [company, existingFile] = await Promise.all([
		api.company.get({ siren: data.declaration.siren }),
		api.jointEvaluation.getFile(),
	]);
	const currentYear = data.declaration.year;
	const campaignDeadlines = await getCampaignDeadlines(currentYear);

	return (
		<JointEvaluationForm
			cseOpinionRequired={isCseOpinionRequired({
				workforce: getObligationWorkforce(company.gipWorkforce),
				hasCse: company.hasCse,
			})}
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
