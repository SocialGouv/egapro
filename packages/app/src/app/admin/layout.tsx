import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "~/modules/admin";
import { LOGIN, MY_SPACE } from "~/modules/routes";
import { auth } from "~/server/auth";

export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await auth();

	if (!session?.user) redirect(LOGIN);
	if (!session.user.isAdmin) redirect(MY_SPACE);

	return <AdminShell>{children}</AdminShell>;
}
