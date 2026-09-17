"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { api } from "~/trpc/react";
import type { SubmissionError } from "./submissionErrorMessage";

export function useRefreshAfterSubmissionError() {
	const router = useRouter();
	const { refetch: waitForServer } = api.profile.get.useQuery(undefined, {
		enabled: false,
		retry: 5,
		retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
	});

	return useCallback(
		(error: SubmissionError) => {
			if (error.data) {
				router.refresh();
				return;
			}
			void waitForServer().then((result) => {
				if (result.isSuccess) router.refresh();
			});
		},
		[router, waitForServer],
	);
}
