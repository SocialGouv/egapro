import { auth } from "~/server/auth";
import { HeaderQuickAccessLinks } from "./HeaderQuickAccessLinks";

/** Desktop quick access: help link and login/logout button or account menu. */
export async function HeaderQuickAccess() {
	const session = await auth();

	return (
		<div className="fr-header__tools">
			<div className="fr-header__tools-links">
				<HeaderQuickAccessLinks session={session} />
			</div>
		</div>
	);
}
