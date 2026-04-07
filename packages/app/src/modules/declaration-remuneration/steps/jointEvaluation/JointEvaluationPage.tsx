import { redirect } from "next/navigation";

import { getCampaignDeadlines } from "~/server/getCampaignDeadlines";
import { api } from "~/trpc/server";

import { JointEvaluationForm } from "./JointEvaluationForm";

export async function JointEvaluationPage() {
	const data = await api.declaration.getOrCreate();

	if (data.declaration.compliancePath !== "joint_evaluation") {
		redirect("/declaration-remuneration/parcours-conformite");
	}

	const company = await api.company.get({ siren: data.declaration.siren });
	const declarationDate = data.declaration.updatedAt
		? new Date(data.declaration.updatedAt).toLocaleDateString("fr-FR")
		: new Date().toLocaleDateString("fr-FR");

	return (
		<JointEvaluationForm
			declarationDate={declarationDate}
			hasCse={company.hasCse}
			jointEvaluationDeadline={
				getCampaignDeadlines().decl1JointEvaluationDeadline
			}
		/>
	);
}
