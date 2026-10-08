import { redirect } from "next/navigation";

import { MissingSiret } from "~/modules/declaration-remuneration";
import { DeclarationLayout } from "~/modules/declaration-representation";
import { getCurrentYear } from "~/modules/domain";
import { LOGIN } from "~/modules/routes";
import { auth } from "~/server/auth";
import { resolveAuthorizedSiren } from "~/server/auth/companyAccess";
import { db } from "~/server/db";
import { api } from "~/trpc/server";

export default async function RepresentationFunnelLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session?.user) {
		redirect(LOGIN);
	}

	const siren = await resolveAuthorizedSiren(db, session);
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
