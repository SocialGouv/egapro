// Import from the package's deep subpaths instead of its barrel entry: the
// barrel statically pulls `track-pages-router`, which `require`s `next/router`.
// `trackEvent` is isomorphic and reachable from Route Handler (app-route)
// module graphs, where `next/router` resolves to a vendored context that does
// not exist — breaking the Turbopack production build (MODULE_UNPARSABLE on
// `app-route/vendored/contexts/router-context.js`). `tracker`/`events` are
// router-free.
import { sendEvent } from "@socialgouv/matomo-next/lib/events";
import { push } from "@socialgouv/matomo-next/lib/tracker";

import { env } from "~/env.js";

import type { MatomoEvent } from "./shared/events";

function isMatomoConfigured(): boolean {
	// `push`/`sendEvent` write to `window._paq`; bail on the server so the
	// module stays safe to import and call from isomorphic code.
	if (typeof window === "undefined") return false;

	return Boolean(env.NEXT_PUBLIC_MATOMO_URL && env.NEXT_PUBLIC_MATOMO_SITE_ID);
}

export function trackEvent({
	category,
	action,
	name,
	value,
	dimensions,
}: MatomoEvent): void {
	if (!isMatomoConfigured()) return;

	if (dimensions) {
		for (const [dimensionId, dimensionValue] of Object.entries(dimensions)) {
			push([
				"setCustomDimension",
				Number(dimensionId),
				dimensionValue,
			] as const);
		}
	}

	if (name !== undefined && value !== undefined) {
		sendEvent({ category, action, name, value });
	} else if (name !== undefined) {
		sendEvent({ category, action, name });
	} else {
		sendEvent({ category, action });
	}
}
