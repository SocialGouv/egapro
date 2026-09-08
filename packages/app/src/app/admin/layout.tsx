import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "~/modules/admin";
import { resolveAdminAccess } from "~/modules/domain";
import { auth } from "~/server/auth";

// Defense in depth behind the Edge middleware, on the same decision table.
// A layout receives no pathname, so the resume screen falls back to `/admin`
// here; the middleware, which knows it, preserves the deep link.
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
