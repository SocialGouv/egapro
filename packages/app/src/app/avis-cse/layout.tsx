import { redirect } from "next/navigation";
import { CseOpinionLayout } from "~/modules/cseOpinion";
import { extractSiren } from "~/modules/my-space";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function CseOpinionRootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	const siret = session.user.siret;
	if (!siret) {
		redirect("/");
	}

	const siren = extractSiren(siret);
	const company = await api.company.get({ siren });

	return <CseOpinionLayout company={company}>{children}</CseOpinionLayout>;
}
