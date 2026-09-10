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

	if (decision.type === "login") redirect(LOGIN);
	if (decision.type === "monEspace") redirect(MY_SPACE);
	if (decision.type === "resume") redirect(ADMIN_MFA_RESUME);

	return <AdminShell>{children}</AdminShell>;
}
