"use client";

// Deep subpath import: the package barrel statically pulls `track-pages-router`
// (`next/router`), which must not enter app-route module graphs. `track-app-router`
// is router-free aside from the App Router `next/navigation` hooks used here.
import { trackAppRouter } from "@socialgouv/matomo-next/lib/track-app-router";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { env } from "~/env.js";

const MATOMO_URL = env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = env.NEXT_PUBLIC_MATOMO_SITE_ID;

function MatomoTracker() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		if (!MATOMO_URL || !MATOMO_SITE_ID) return;

		trackAppRouter({
			url: MATOMO_URL,
			siteId: MATOMO_SITE_ID,
			pathname,
			searchParams: searchParams ?? undefined,
		});
	}, [pathname, searchParams]);

	return null;
}

export function MatomoAnalytics() {
	if (!MATOMO_URL || !MATOMO_SITE_ID) return null;

	return (
		<Suspense fallback={null}>
			<MatomoTracker />
		</Suspense>
	);
}
