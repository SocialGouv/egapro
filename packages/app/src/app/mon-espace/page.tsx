import { redirect } from "next/navigation";

import { MonEspacePage } from "~/modules/my-space";
import { auth } from "~/server/auth";
import { getEffectiveSiren } from "~/server/auth/companyAccess";
import { api, HydrateClient } from "~/trpc/server";

export default async function Page() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	// When an admin is impersonating a company, use the impersonated SIREN.
	// MonEspacePage expects a SIRET-length string for symmetric handling;
	// passing the SIREN (9 chars) is fine since it only reads the first 9.
	const effectiveSiret = getEffectiveSiren(session);

	// The JWT only captures `phone` at sign-in, so `session.user.phone` goes
	// stale as soon as the user saves a phone through the missing-info modal
	// and re-triggers it on every render. Reading from the profile table on
	// each page load keeps the missing-info gate honest. Fall back to `null`
	// when the profile row is missing so the page still renders (the modal
	// will prompt for a phone number just like before).
	const profile = await api.profile.get().catch(() => null);

	return (
		<HydrateClient>
			<MonEspacePage
				siret={effectiveSiret}
				userPhone={profile?.phone ?? null}
			/>
		</HydrateClient>
	);
}
