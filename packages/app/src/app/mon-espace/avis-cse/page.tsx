import { notFound, redirect } from "next/navigation";
import { SubmittedOpinionsPage } from "~/modules/cseOpinion";
import { LOGIN } from "~/modules/routes";
import { auth } from "~/server/auth";
import { resolveAuthorizedSiren } from "~/server/auth/companyAccess";
import { db } from "~/server/db";
import { api } from "~/trpc/server";

export const metadata = { title: "Avis du CSE transmis" };

export default async function Page() {
	const session = await auth();
	if (!session?.user) redirect(LOGIN);
	const siren = await resolveAuthorizedSiren(db, session);
	if (!siren) notFound();
	const data = await api.cseOpinion
		.getSubmittedView()
		.catch((error: unknown) => {
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === "NOT_FOUND"
			)
				notFound();
			throw error;
		});
	const company = await api.company.get({ siren });
	return <SubmittedOpinionsPage {...data} company={company} />;
}
