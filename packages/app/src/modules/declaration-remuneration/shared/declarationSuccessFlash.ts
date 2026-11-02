const STORAGE_KEY = "egapro:declaration-transmission-success";
const MAX_AGE_MS = 30_000;

export function markDeclarationTransmissionSuccess() {
	try {
		window.sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
	} catch {
		// Storage can be disabled; navigation must still work after submission.
	}
}

export function consumeDeclarationTransmissionSuccess() {
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
