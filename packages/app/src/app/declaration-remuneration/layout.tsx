import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { DeclarationLayout, MissingSiret } from "~/modules/declaration";

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

	const siren = siret.slice(0, 9);

	return <DeclarationLayout siren={siren}>{children}</DeclarationLayout>;
}
