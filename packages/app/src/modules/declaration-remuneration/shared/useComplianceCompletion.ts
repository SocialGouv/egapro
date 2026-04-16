"use client";

import { useEffect, useRef } from "react";
import { useIsImpersonating } from "~/modules/auth";
import { api } from "~/trpc/react";

/**
 * Marks the compliance path as completed on first render (fire-and-forget).
 *
 * Skipped during admin impersonation: the mutation is server-side blocked
 * anyway, and firing it on every admin page view would just generate failed
 * audit rows without any benefit (issue #3230).
 */
export function useComplianceCompletion() {
	const { mutate } = api.declaration.completeCompliancePath.useMutation();
	const called = useRef(false);
	const isImpersonating = useIsImpersonating();

	useEffect(() => {
		if (isImpersonating) return;
		if (!called.current) {
			called.current = true;
			mutate();
		}
	}, [mutate, isImpersonating]);
}
