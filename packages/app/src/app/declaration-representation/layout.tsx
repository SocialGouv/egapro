import { redirect } from "next/navigation";

import { MissingSiret } from "~/modules/declaration-remuneration";
import { DeclarationLayout } from "~/modules/declaration-representation";
import { getCurrentYear } from "~/modules/domain";
import { auth } from "~/server/auth";
import { getEffectiveSiren } from "~/server/auth/companyAccess";
import { api } from "~/trpc/server";

export default async function RepresentationFunnelLayout({
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

	const company = await api.company.get({ siren });

	return (
		<DeclarationLayout campaignYear={getCurrentYear()} company={company}>
			{children}
		</DeclarationLayout>
	);
}
