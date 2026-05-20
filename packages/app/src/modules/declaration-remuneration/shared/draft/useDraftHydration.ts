"use client";

import { useEffect, useRef, useState } from "react";

export function useDraftHydration<T extends Record<string, unknown>>(
	isLoadingDraft: boolean,
	draft: Partial<T>,
	applyDraft: (draft: Partial<T>) => void,
): boolean {
	const [hydrated, setHydrated] = useState(false);
	const applyRef = useRef(applyDraft);
	applyRef.current = applyDraft;

	useEffect(() => {
		if (isLoadingDraft || hydrated) return;
		applyRef.current(draft);
		setHydrated(true);
	}, [isLoadingDraft, hydrated, draft]);

	return hydrated;
}
