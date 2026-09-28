import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
	AdminAccessPage,
	sanitizeAdminReturnPath,
} from "~/modules/admin/access";
import { resolveAdminAccess } from "~/modules/domain";
import { LoginPage, sanitizeCallbackUrl } from "~/modules/login";
import { MY_SPACE, runtimeRoute } from "~/modules/routes";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Connexion" };

type PageProps = {
	searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
	const { callbackUrl, error } = await searchParams;
	const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);

	const session = await auth();

	if (session?.user) {
		// A step-up abandoned or refused by ProConnect lands back here, still
		// signed in under the session that was open before the attempt — the
		// declarant journey is never closed nor degraded by the failure. Only
		// the admin second-factor state can be stale, so the same decision
		// table the resume screen and the `/admin` guard run is the one that
		// tells us whether to explain the failure instead of the usual bounce.
		if (error) {
			const decision = resolveAdminAccess(session.user, new Date());
			if (decision.type === "resume") {
				return (
					<AdminAccessPage
						reason={decision.reason}
						returnPath={sanitizeAdminReturnPath(safeCallbackUrl)}
					/>
				);
			}
		}
		redirect(safeCallbackUrl ? runtimeRoute(safeCallbackUrl) : MY_SPACE);
	}

	return <LoginPage callbackUrl={safeCallbackUrl} />;
}
