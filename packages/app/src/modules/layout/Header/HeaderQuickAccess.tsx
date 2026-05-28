import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { HeaderQuickAccessLinks } from "./HeaderQuickAccessLinks";

/** Desktop quick access: help link and login/logout button or account menu. */
export async function HeaderQuickAccess() {
	const session = await auth();

	// `session.user.phone` is captured in the JWT only at sign-in, so it goes
	// stale when the user updates their phone via the profile modal. Read the
	// fresh value from the profile table to keep the dropdown accurate without
	// requiring a re-login.
	const profile = session?.user
		? await api.profile.get().catch(() => null)
		: null;

	return (
		<div className="fr-header__tools">
			<div className="fr-header__tools-links">
				<HeaderQuickAccessLinks
					session={session}
					userPhone={profile?.phone ?? null}
				/>
			</div>
		</div>
	);
}
