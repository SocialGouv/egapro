import { push, sendEvent } from "@socialgouv/matomo-next";

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
