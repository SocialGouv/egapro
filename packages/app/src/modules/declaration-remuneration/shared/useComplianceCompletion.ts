"use client";

import { useEffect, useRef } from "react";
import { api } from "~/trpc/react";

/** Marks the compliance path as completed on first render (fire-and-forget). */
export function useComplianceCompletion() {
	const { mutate } = api.declaration.completeCompliancePath.useMutation();
	const called = useRef(false);

	useEffect(() => {
		if (!called.current) {
			called.current = true;
			mutate();
		}
	}, [mutate]);
}
