import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminNavigation } from "~/modules/admin";
import { auth } from "~/server/auth";

export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	if (!session.user.isAdmin) {
		redirect("/mon-espace");
	}

	return (
		<div className="fr-container fr-py-6w">
			<div className="fr-grid-row fr-grid-row--gutters">
				<div className="fr-col-12 fr-col-md-4">
					<AdminNavigation />
				</div>
				<div className="fr-col-12 fr-col-md-8">{children}</div>
			</div>
		</div>
	);
}
