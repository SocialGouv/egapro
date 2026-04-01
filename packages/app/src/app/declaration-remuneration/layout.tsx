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

	const siret = session.user.siret;
	if (!siret) {
		return <MissingSiret />;
	}

	const siren = extractSiren(siret);
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
