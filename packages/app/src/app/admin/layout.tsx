import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "~/modules/admin";
import { resolveAdminAccess } from "~/modules/domain";
import { auth } from "~/server/auth";

/**
 * Node-runtime guard of the backoffice, running the same decision table as the
 * Edge middleware — defense in depth, never the only barrier.
 *
 * It does not know which path was requested (a layout receives no pathname), so
 * the resume screen falls back to `/admin` here. The middleware, which does
 * know, is what preserves the deep link in the normal path.
 */
export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await auth();
	const decision = resolveAdminAccess(session?.user, new Date());

	if (decision.type === "login") redirect("/login");
	if (decision.type === "monEspace") redirect("/mon-espace");
	if (decision.type === "resume") redirect("/acces-backoffice");

	return <AdminShell>{children}</AdminShell>;
}
