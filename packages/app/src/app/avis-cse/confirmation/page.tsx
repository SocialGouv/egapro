import { redirect } from "next/navigation";
import {
	campaignYearDimension,
	FunnelCompleteTracker,
} from "~/modules/analytics";
import { ConfirmationPage, CSE_FUNNEL } from "~/modules/cseOpinion";
import { isDeclarationSubmitted } from "~/modules/cseOpinion/confirmationHelpers";
import { getWorkforceYearFor } from "~/modules/domain";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function CseOpinionConfirmationPage() {
	const [session, declarationData] = await Promise.all([
		auth(),
		api.declaration.getOrCreate(),
	]);

	if (!isDeclarationSubmitted(declarationData.declaration.status)) {
		redirect("/mon-espace");
	}

	return (
		<>
			<FunnelCompleteTracker
				config={CSE_FUNNEL}
				dimensions={campaignYearDimension(declarationData.declaration.year)}
			/>
			<ConfirmationPage
				dataYear={getWorkforceYearFor(declarationData.declaration.year)}
				declarationYear={declarationData.declaration.year}
				email={session?.user?.email ?? undefined}
				hasSecondDeclaration={declarationData.hasSubmittedSecondDeclaration}
			/>
		</>
	);
}
