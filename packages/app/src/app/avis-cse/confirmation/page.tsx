import { ConfirmationPage } from "~/modules/cseOpinion";
import { auth } from "~/server/auth";

export default async function CseOpinionConfirmationPage() {
	const session = await auth();

	return <ConfirmationPage email={session?.user?.email ?? undefined} />;
}
