import { redirect } from "next/navigation";
import {
	DeclarationLayout,
	MissingSiret,
} from "~/modules/declaration-remuneration";
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

	const siren = siret.slice(0, 9);
	const company = await api.company.get({ siren });

	return <DeclarationLayout company={company}>{children}</DeclarationLayout>;
}
