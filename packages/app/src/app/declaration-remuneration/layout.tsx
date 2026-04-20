import { redirect } from "next/navigation";
import {
	DeclarationLayout,
	MissingSiret,
} from "~/modules/declaration-remuneration";
import { extractSiren } from "~/modules/domain";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function DeclarationRootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	// When an admin is impersonating a company, the admin's own SIRET is
	// usually empty — fall back to the impersonated SIREN so the banner and
	// declaration context still render on every step (mirrors mon-espace).
	const siren =
		session.user.isAdmin && session.user.impersonation
			? session.user.impersonation.siren
			: session.user.siret
				? extractSiren(session.user.siret)
				: null;

	if (!siren) {
		return <MissingSiret />;
	}

	const [company, declarationData] = await Promise.all([
		api.company.get({ siren }),
		api.declaration.getOrCreate(),
	]);

	return (
		<DeclarationLayout
			company={company}
			declarationYear={declarationData.declaration.year}
		>
			{children}
		</DeclarationLayout>
	);
}
