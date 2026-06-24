import {
	elapsedSeconds,
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";

// Shared timer for the "time to fill the category model" measure. It is started
// when the user opens the import modal, and consumed on a successful import.
// Only an elapsed-seconds number is ever emitted — no PII.
const TIMER_KEY = "egapro:category-model-started-at";

/** Start the category-model timer if one is not already running. */
export function startCategoryModelTimer(): void {
	if (typeof window === "undefined") return;
	if (sessionStorage.getItem(TIMER_KEY) === null) {
		sessionStorage.setItem(TIMER_KEY, String(Date.now()));
	}
}

/**
 * Emit the import-duration event when a start time is known, then clear it.
 * No-op (and no event) when the user imported without first downloading the
 * template or opening the modal in this session.
 */
export function trackCategoryImportDuration(): void {
	if (typeof window === "undefined") return;
	const raw = sessionStorage.getItem(TIMER_KEY);
	if (raw === null) return;
	sessionStorage.removeItem(TIMER_KEY);
	const startedAt = Number(raw);
	if (!Number.isFinite(startedAt)) return;
	trackEvent({
		category: MATOMO_EVENT_CATEGORY.DOCUMENT,
		action: MATOMO_ACTION.CATEGORY_IMPORT_DURATION,
		value: elapsedSeconds(startedAt, Date.now()),
	});
}
