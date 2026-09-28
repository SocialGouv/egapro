"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { SubmissionError } from "./submissionErrorMessage";

const HEALTHZ_PATH = "/api/healthz";
const MAX_PROBE_ATTEMPTS = 5;
const MAX_BACKOFF_MS = 8_000;

function backoffDelay(attempt: number): number {
	return Math.min(1_000 * 2 ** attempt, MAX_BACKOFF_MS);
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// /api/healthz reads nothing and always answers 200 while the app is up, so unlike a tRPC probe it can't confuse an UNAUTHORIZED/NOT_FOUND from a reachable server with a down one, and carries no personal data into the audit log.
async function probeServerReachable(): Promise<boolean> {
	for (let attempt = 0; attempt < MAX_PROBE_ATTEMPTS; attempt++) {
		try {
			const response = await fetch(HEALTHZ_PATH, { cache: "no-store" });
			if (response.ok) return true;
		} catch {}
		if (attempt < MAX_PROBE_ATTEMPTS - 1) {
			await wait(backoffDelay(attempt));
		}
	}
	return false;
}

export function useRefreshAfterSubmissionError() {
	const router = useRouter();
	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return useCallback(
		(error: SubmissionError) => {
			if (error.data) {
				router.refresh();
				return;
			}
			void probeServerReachable().then((reachable) => {
				if (reachable && isMountedRef.current) router.refresh();
			});
		},
		[router],
	);
}
