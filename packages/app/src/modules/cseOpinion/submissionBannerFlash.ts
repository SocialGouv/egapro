const STORAGE_KEY = "egapro:cse-submission-banner";
const MAX_AGE_MS = 30_000;

/**
 * The submission banner (second declaration / joint evaluation transmitted)
 * is a success message for the transmission that just happened — not a
 * standing summary of the declaration's state. `getSubmissionBannerState`
 * stays true for the entire `awaiting_cse_opinion` status and beyond, so its
 * result alone cannot drive visibility (#5124). Same one-shot session flash
 * as `declarationSuccessFlash`, kept separate because it gates a different
 * banner, consumed from a different module, with its own storage key.
 */
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
