import { redirect } from "next/navigation";
import {
	DeclarationLayout,
	MissingSiret,
} from "~/modules/declaration-remuneration";
import { auth } from "~/server/auth";
import { getEffectiveSiren } from "~/server/auth/companyAccess";
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

	const siren = getEffectiveSiren(session);
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
