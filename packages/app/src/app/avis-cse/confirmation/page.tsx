import { ConfirmationPage } from "~/modules/cseOpinion";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function CseOpinionConfirmationPage() {
	const [session, declarationData] = await Promise.all([
		auth(),
		api.declaration.getOrCreate(),
	]);

	const hasSecondDeclaration =
		declarationData.declaration.secondDeclarationStatus === "submitted";

	return (
		<ConfirmationPage
			email={session?.user?.email ?? undefined}
			hasSecondDeclaration={hasSecondDeclaration}
		/>
	);
}
