import { redirect } from "next/navigation";

import { CompanyDeclarationsPage } from "~/modules/my-space";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

const SIREN_LENGTH = 9;

export default async function Page() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	const siret = session.user.siret;

	if (!siret || siret.length < SIREN_LENGTH) {
		redirect("/mon-espace/mes-entreprises");
	}

	const siren = siret.slice(0, SIREN_LENGTH);
	const data = await api.company.getWithDeclarations({ siren });

	return (
		<HydrateClient>
			<CompanyDeclarationsPage
				company={data.company}
				declarations={data.declarations}
				userPhone={session.user.phone ?? null}
			/>
		</HydrateClient>
	);
}
