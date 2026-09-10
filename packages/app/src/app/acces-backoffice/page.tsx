import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
	AdminAccessPage,
	sanitizeAdminReturnPath,
} from "~/modules/admin/access";
import { resolveAdminAccess } from "~/modules/domain";
import {
	LOGIN,
	MY_SPACE,
	routeWithQuery,
	runtimeRoute,
} from "~/modules/routes";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Accès à l'administration" };

type PageProps = {
	searchParams: Promise<{ retour?: string }>;
};

// Outside `/admin` on purpose: under the backoffice guard this screen would bounce against that very guard.
export default async function Page({ searchParams }: PageProps) {
	const { retour } = await searchParams;
	const returnPath = sanitizeAdminReturnPath(retour);

	const session = await auth();
	const decision = resolveAdminAccess(session?.user, new Date());

	if (decision.type === "login") {
		redirect(
			routeWithQuery(LOGIN, new URLSearchParams({ callbackUrl: returnPath })),
		);
	}
	if (decision.type === "monEspace") redirect(MY_SPACE);
	// Nothing left to resume: the agent goes straight where they were headed.
	if (decision.type === "allow") redirect(runtimeRoute(returnPath));

	return <AdminAccessPage reason={decision.reason} returnPath={returnPath} />;
}
