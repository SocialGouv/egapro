"use client";

import { useEffect, useRef } from "react";
import { api } from "~/trpc/react";

export function ComplianceCompletionTracker() {
	const mutation = api.declaration.completeCompliancePath.useMutation();
	const called = useRef(false);

	useEffect(() => {
		if (!called.current) {
			called.current = true;
			mutation.mutate();
		}
	}, [mutation]);

	return null;
}
