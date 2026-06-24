"use client";

// Deep subpath imports: the package barrel statically pulls `track-pages-router`
// (`next/router`), which must not enter app-route module graphs. `track-app-router`
// and `tracker` are router-free aside from the App Router `next/navigation` hooks used here.
import { trackAppRouter } from "@socialgouv/matomo-next/lib/track-app-router";
import { push } from "@socialgouv/matomo-next/lib/tracker";
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
			// Drop query strings — a free-text search or OIDC callback can carry a
			// SIREN, company name or email that must never reach Matomo.
			cleanUrl: true,
			onInitialization: () => {
				// Honour Do Not Track and keep heatmaps/session recording off
				// (CNIL consent-exemption), before the first hit is sent.
				push(["setDoNotTrack", true]);
				push(["HeatmapSessionRecording::disable"]);
			},
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
