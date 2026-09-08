import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccessPage, sanitizeAdminReturnPath } from "~/modules/admin/access";
import { resolveAdminAccess } from "~/modules/domain";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Accès à l'administration" };

type PageProps = {
	searchParams: Promise<{ retour?: string }>;
};

/**
 * Resume screen of the backoffice two-factor authentication. It lives outside
 * `/admin` on purpose: served by a route the backoffice guard covers, it would
 * bounce against that very guard.
 *
 * It runs the same decision table as the guard, so an agent without the admin
 * grant is turned away towards `/mon-espace` exactly as they would be on
 * `/admin` — an exception here would turn the screen into the disclosure the
 * guard refuses to make.
 */
export default async function Page({ searchParams }: PageProps) {
	const { retour } = await searchParams;
	const returnPath = sanitizeAdminReturnPath(retour);

	const session = await auth();
	const decision = resolveAdminAccess(session?.user, new Date());

	if (decision.type === "login") {
		redirect(`/login?callbackUrl=${encodeURIComponent(returnPath)}`);
	}
	if (decision.type === "monEspace") redirect("/mon-espace");
	// Already authenticated at the required level: nothing to resume, the agent
	// goes straight where they were headed.
	if (decision.type === "allow") redirect(returnPath);

	return <AdminAccessPage reason={decision.reason} returnPath={returnPath} />;
}
