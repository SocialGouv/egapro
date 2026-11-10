const STORAGE_KEY = "egapro:cse-submission-banner";
const MAX_AGE_MS = 30_000;

// Gates visibility of a one-time success message; getSubmissionBannerState alone can't, since it stays true for the rest of the démarche.
export function markSubmissionBannerFlash() {
	try {
		window.sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
	} catch {
		// Storage can be disabled; navigation must still work after submission.
	}
}

export function consumeSubmissionBannerFlash() {
	try {
		const storedAt = window.sessionStorage.getItem(STORAGE_KEY);
		window.sessionStorage.removeItem(STORAGE_KEY);

		if (!storedAt) return false;

		const age = Date.now() - Number(storedAt);
		return Number.isFinite(age) && age >= 0 && age <= MAX_AGE_MS;
	} catch {
		return false;
	}
}
