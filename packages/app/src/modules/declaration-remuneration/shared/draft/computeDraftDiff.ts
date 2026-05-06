function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a == null && b == null) return true;
	if (a == null || b == null) return false;
	const aIsArr = Array.isArray(a);
	const bIsArr = Array.isArray(b);
	if (aIsArr && bIsArr) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i += 1) {
			if (!deepEqual(a[i], b[i])) return false;
		}
		return true;
	}
	if (aIsArr !== bIsArr) return false;
	if (typeof a === "object" && typeof b === "object") {
		const aRecord = a as Record<string, unknown>;
		const bRecord = b as Record<string, unknown>;
		const keysA = Object.keys(aRecord);
		const keysB = Object.keys(bRecord);
		if (keysA.length !== keysB.length) return false;
		for (const key of keysA) {
			if (!Object.hasOwn(bRecord, key)) return false;
			if (!deepEqual(aRecord[key], bRecord[key])) return false;
		}
		return true;
	}
	return false;
}

export function computeDraftDiff<T extends Record<string, unknown>>(
	currentValues: T,
	dbValues: T,
): Partial<T> {
	const diff: Partial<T> = {};
	for (const key of Object.keys(currentValues) as Array<keyof T>) {
		if (!deepEqual(currentValues[key], dbValues[key])) {
			diff[key] = currentValues[key];
		}
	}
	return diff;
}
