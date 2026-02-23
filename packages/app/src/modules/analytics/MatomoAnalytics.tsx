"use client";

import { trackAppRouter } from "@socialgouv/matomo-next";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

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
