import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
	AdminAccessPage,
	sanitizeAdminReturnPath,
} from "~/modules/admin/access";
import { resolveAdminAccess } from "~/modules/domain";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Accès à l'administration" };

type PageProps = {
	searchParams: Promise<{ retour?: string }>;
};

// Outside `/admin` on purpose: under the backoffice guard, this screen would
// bounce against that very guard. It runs the same decision table, so a user
// without the grant is turned away exactly as on `/admin` — an exception here
// would make this screen the disclosure the guard refuses to make.
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
