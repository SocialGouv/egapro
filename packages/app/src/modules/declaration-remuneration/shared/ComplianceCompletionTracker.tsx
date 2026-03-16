"use client";

import { useEffect, useRef } from "react";
import { api } from "~/trpc/react";

export function ComplianceCompletionTracker() {
	const { mutate } = api.declaration.completeCompliancePath.useMutation();
	const called = useRef(false);

	useEffect(() => {
		if (!called.current) {
			called.current = true;
			mutate();
		}
	}, [mutate]);

	return null;
}
