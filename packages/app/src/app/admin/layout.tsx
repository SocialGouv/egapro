import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "~/modules/admin";
import { resolveAdminAccess } from "~/modules/domain";
import { ADMIN_MFA_RESUME, LOGIN, MY_SPACE } from "~/modules/routes";
import { auth } from "~/server/auth";

// Defense in depth behind the Edge middleware; a layout receives no pathname, hence the `/admin` fallback on resume.
export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await auth();
	const decision = resolveAdminAccess(session?.user, new Date());

	switch (decision.type) {
		case "login":
			return redirect(LOGIN);
		case "monEspace":
			return redirect(MY_SPACE);
		case "resume":
			return redirect(ADMIN_MFA_RESUME);
		case "allow":
			return <AdminShell>{children}</AdminShell>;
		default:
			decision satisfies never;
			return redirect(LOGIN);
	}
}
