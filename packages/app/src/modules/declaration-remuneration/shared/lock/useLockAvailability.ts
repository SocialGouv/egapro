"use client";

import { LOCK_HEARTBEAT_INTERVAL_MS } from "~/modules/domain";
import { api } from "~/trpc/react";

type UseLockAvailabilityOptions = {
	declarationId: string;
	isWatching: boolean;
};

export type LockAvailability = {
	available: boolean | null;
	lockTimeoutMinutes: number | null;
	recheck: () => Promise<unknown>;
	forget: () => Promise<void>;
};

export function useLockAvailability({
	declarationId,
	isWatching,
}: UseLockAvailabilityOptions): LockAvailability {
	const utils = api.useUtils();
	const query = api.declarationLock.getLockAvailability.useQuery(
		{ declarationId },
		{
			enabled: isWatching,
			refetchInterval: isWatching ? LOCK_HEARTBEAT_INTERVAL_MS : false,
			refetchIntervalInBackground: false,
			refetchOnWindowFocus: false,
			staleTime: 0,
		},
	);

	return {
		available: query.data?.available ?? null,
		lockTimeoutMinutes: query.data?.lockTimeoutMinutes ?? null,
		recheck: query.refetch,
		forget: () =>
			utils.declarationLock.getLockAvailability.reset({ declarationId }),
	};
}
