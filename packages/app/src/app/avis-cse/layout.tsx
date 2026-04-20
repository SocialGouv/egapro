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

	// In mimoquage, the admin's own SIRET is typically empty — the banner must
	// show the impersonated company (owner of the declaration being viewed),
	// mirrors the declaration-remuneration layout.
	const siren =
		session.user.isAdmin && session.user.impersonation
			? session.user.impersonation.siren
			: session.user.siret
				? extractSiren(session.user.siret)
				: null;

	if (!siren) {
		redirect("/");
	}

	const [company, declarationData] = await Promise.all([
		api.company.get({ siren }),
		api.declaration.getOrCreate(),
	]);

	return (
		<CseOpinionLayout
			company={company}
			declarationYear={declarationData.declaration.year}
		>
			{children}
		</CseOpinionLayout>
	);
}
