import { redirect } from "next/navigation";

import { MonEspacePage } from "~/modules/my-space";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

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

	// The JWT only captures `phone` at sign-in, so `session.user.phone` goes
	// stale as soon as the user saves a phone through the missing-info modal
	// and re-triggers it on every render. Reading from the profile table on
	// each page load keeps the missing-info gate honest.
	const profile = await api.profile.get();

	return (
		<HydrateClient>
			<MonEspacePage siret={effectiveSiret} userPhone={profile.phone ?? null} />
		</HydrateClient>
	);
}
