import { redirect } from "next/navigation";
import { ConfirmationPage } from "~/modules/cseOpinion";
import {
	hasSubmittedSecondDeclaration,
	isDeclarationSubmitted,
} from "~/modules/cseOpinion/confirmationHelpers";
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
		<ConfirmationPage
			declarationYear={declarationData.declaration.year}
			email={session?.user?.email ?? undefined}
			hasSecondDeclaration={hasSubmittedSecondDeclaration(
				declarationData.declaration.secondDeclarationStatus,
			)}
		/>
	);
}
