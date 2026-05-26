"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value` debounced by `delayMs` milliseconds.
 *
 * On every change of `value`, a timer is reset; the returned value updates
 * only once the timer fires without further changes. Used to throttle filter
 * inputs that drive expensive tRPC queries (e.g. K5 stagnation slider).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handle = setTimeout(() => setDebouncedValue(value), delayMs);
		return () => clearTimeout(handle);
	}, [value, delayMs]);

	return debouncedValue;
}
