import { redirect } from "next/navigation";

import { AdminHomePage } from "~/modules/admin";
import { auth } from "~/server/auth";

export default async function Page() {
	const session = await auth();

	// Defense in depth — the layout already guards this route, but we keep the
	// check here so the page cannot render for a non-admin session.
	if (!session?.user?.isAdmin) {
		redirect("/mon-espace");
	}

	return (
		<AdminHomePage
			userEmail={session.user.email ?? ""}
			userName={session.user.name ?? session.user.email ?? ""}
		/>
	);
}
