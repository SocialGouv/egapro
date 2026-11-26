import type { Metadata } from "next";

import { AdminHomePage } from "~/modules/admin";
import { auth } from "~/server/auth";
import { readServiceStatusBanner } from "~/server/services/serviceStatus";

export const metadata: Metadata = { title: "Backoffice" };

export default async function Page() {
	// Access control is handled by the edge middleware and the admin layout;
	// when this page renders we are guaranteed to have an admin session.
	const session = await auth();
	const user = session?.user;
	const serviceStatus = await readServiceStatusBanner();

	return (
		<AdminHomePage
			serviceStatus={serviceStatus}
			userEmail={user?.email ?? ""}
			userName={user?.name ?? user?.email ?? ""}
		/>
	);
}
