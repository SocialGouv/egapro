import { redirect } from "next/navigation";

import { MonEspacePage } from "~/modules/my-space";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Page() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	// When an admin is impersonating a company, use the impersonated SIREN
	// (padded to SIRET length so MonEspacePage can extract it the same way).
	const effectiveSiret =
		session.user.isAdmin && session.user.impersonation
			? session.user.impersonation.siren
			: (session.user.siret ?? null);

	return (
		<HydrateClient>
			<MonEspacePage
				siret={effectiveSiret}
				userPhone={session.user.phone ?? null}
			/>
		</HydrateClient>
	);
}
