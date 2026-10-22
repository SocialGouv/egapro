import { redirect } from "next/navigation";
import { mapOpinionsFromDb } from "~/modules/cseOpinion";
import { cseOpinionStepHref } from "~/modules/routes";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export const metadata = { title: "Avis du CSE" };

export default async function CseOpinionPage() {
	const session = await auth();
	if (session?.user.impersonation) {
		const { opinions } = await api.cseOpinion.get();
		const initialData = mapOpinionsFromDb(opinions);
		redirect(cseOpinionStepHref(initialData ? 2 : 1));
	}

	redirect(cseOpinionStepHref(1));
}
