"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
	DECLARATION_LOCK_CONFLICT_MESSAGE,
	LOCK_HEARTBEAT_INTERVAL_MS,
} from "~/modules/domain";
import { API_DECLARATION_LOCK_RELEASE } from "~/modules/routes";
import { api } from "~/trpc/react";
import type {
	DeclarationLockState,
	LockHolder,
	ReadOnlyReason,
	RetakeStatus,
} from "./types";
import { useLockAvailability } from "./useLockAvailability";

type UseDeclarationLockOptions = {
	declarationId: string;
	modificationClosed?: boolean;
};

const RELEASE_ENDPOINT = API_DECLARATION_LOCK_RELEASE;

export function useDeclarationLock({
	declarationId,
	modificationClosed = false,
}: UseDeclarationLockOptions): DeclarationLockState {
	const session = useSession();
	const router = useRouter();
	const queryClient = useQueryClient();
	const utils = api.useUtils();
	const isImpersonating = Boolean(session.data?.user?.impersonation);
	const isEnabled =
		session.status === "authenticated" &&
		!isImpersonating &&
		!modificationClosed;

	const [holder, setHolder] = useState<LockHolder | null>(null);
	const [isReadOnly, setIsReadOnly] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [retakeStatus, setRetakeStatus] = useState<RetakeStatus>("idle");
	const [isWaitingForRefresh, setIsWaitingForRefresh] = useState(false);
	const [isRefreshing, startRefresh] = useTransition();
	const [editSessionKey, setEditSessionKey] = useState(0);

	const reason: ReadOnlyReason | null = isImpersonating
		? "impersonation"
		: modificationClosed
			? "modification_closed"
			: isReadOnly
				? "lock"
				: null;
	const isLockedOut = reason === "lock";

	const availability = useLockAvailability({
		declarationId,
		isWatching:
			isLockedOut && retakeStatus !== "pending" && !isWaitingForRefresh,
	});

	const acquire = api.declarationLock.acquireLock.useMutation();
	const heartbeat = api.declarationLock.heartbeat.useMutation();

	const acquireRef = useRef(acquire.mutateAsync);
	const heartbeatRef = useRef(heartbeat.mutateAsync);
	const recheckRef = useRef(availability.recheck);
	const forgetAvailabilityRef = useRef(availability.forget);
	const fetchLockStateRef = useRef(utils.declarationLock.getLockState.fetch);
	acquireRef.current = acquire.mutateAsync;
	heartbeatRef.current = heartbeat.mutateAsync;
	recheckRef.current = availability.recheck;
	forgetAvailabilityRef.current = availability.forget;
	fetchLockStateRef.current = utils.declarationLock.getLockState.fetch;

	// Tracks whether *this* tab currently holds the editor lock, read by the
	// pagehide beacon and the unmount cleanup without re-running the effect.
	const isHolderRef = useRef(false);
	// A retaken lock must not unlock the forms before the refreshed data lands.
	const isAwaitingFreshDataRef = useRef(false);
	const startHeartbeatRef = useRef<(() => void) | null>(null);
	const isRetakeInFlightRef = useRef(false);
	const holderRef = useRef(holder);
	holderRef.current = holder;

	useEffect(() => {
		setRetakeStatus("idle");
		if (!isEnabled) {
			isHolderRef.current = false;
			startHeartbeatRef.current = null;
			// Impersonation and a passed modification deadline are read-only reasons
			// too: surface them through the same state so the shared context exposes
			// a single read-only flag. The collaborative lock stays disabled (no
			// acquire/heartbeat) in both cases.
			setIsReadOnly(isImpersonating || modificationClosed);
			setHolder(null);
			// Stay "loading" while the session is still resolving so consumers do
			// not flash an editable state before ownership is known.
			setIsLoading(session.status === "loading");
			return;
		}

		let cancelled = false;
		let intervalId: ReturnType<typeof setInterval> | null = null;

		const stopHeartbeat = () => {
			if (intervalId !== null) {
				clearInterval(intervalId);
				intervalId = null;
			}
		};

		const refreshOwnership = async () => {
			try {
				const result = await acquireRef.current({ declarationId });
				if (cancelled) return;
				isHolderRef.current = result.acquired;
				setIsReadOnly(!result.acquired || isAwaitingFreshDataRef.current);
				setHolder(result.holder);
				if (!result.acquired) {
					stopHeartbeat();
					setRetakeStatus("idle");
				}
			} catch {
				if (cancelled) return;
				isHolderRef.current = false;
				setIsReadOnly(true);
				setHolder(null);
			}
		};

		const startHeartbeat = () => {
			if (intervalId !== null) return;
			intervalId = setInterval(() => {
				void heartbeatRef
					.current({ declarationId })
					.then((result) => {
						if (cancelled) return;
						if (result.held) {
							// A heartbeat the server accepts proves this tab still owns the
							// lock: restore the editable state if a transient acquire
							// failure had pessimistically flipped it to read-only, which
							// nothing else would ever undo.
							isHolderRef.current = true;
							if (!isAwaitingFreshDataRef.current) setIsReadOnly(false);
							return;
						}
						// Lock lost (expired or taken over): re-read the current holder.
						void refreshOwnership();
					})
					.catch(() => {});
			}, LOCK_HEARTBEAT_INTERVAL_MS);
		};
		startHeartbeatRef.current = startHeartbeat;

		// Re-reads ownership, then resumes the heartbeat if this tab won the lock
		// back. Called whenever the tab may have drifted from the server state
		// while it was away: `handleHide` releases the lock as soon as the tab is
		// hidden, and the heartbeat that would notice is throttled in a background
		// tab and frozen while the machine sleeps. Without this, a tab left open
		// overnight comes back believing it still holds a lock the server dropped,
		// and the first write is rejected with a bogus "locked by another user"
		// (issue #4186).
		const reconcileOwnership = async () => {
			await refreshOwnership();
			if (cancelled) return;
			if (isHolderRef.current) startHeartbeat();
		};

		// A locked-out tab never takes the lock implicitly: its form may predate the holder's saves.
		const resync = () => {
			if (isHolderRef.current) {
				void reconcileOwnership();
				return;
			}
			void recheckRef.current();
		};

		const handleHide = () => {
			if (!isHolderRef.current) return;
			const payload = JSON.stringify({ declarationId });
			const blob = new Blob([payload], { type: "application/json" });
			navigator.sendBeacon(RELEASE_ENDPOINT, blob);
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				handleHide();
				return;
			}
			resync();
		};

		// Symmetric to the `pagehide` beacon: a bfcache restore resumes a page
		// whose lock was released on the way out.
		const handlePageShow = (event: PageTransitionEvent) => {
			if (!event.persisted) return;
			resync();
		};

		// A write rejected because the lock is not held is the authoritative
		// signal that this tab's ownership is stale — the step form would
		// otherwise keep showing an editable form under a red lock error.
		const unsubscribeFromMutations = queryClient
			.getMutationCache()
			.subscribe((event) => {
				if (event.type !== "updated" || event.action.type !== "error") return;
				const error = event.action.error;
				if (
					!(error instanceof Error) ||
					error.message !== DECLARATION_LOCK_CONFLICT_MESSAGE
				) {
					return;
				}
				resync();
			});

		setIsLoading(true);
		void (async () => {
			await refreshOwnership();
			if (cancelled) return;
			setIsLoading(false);
			if (isHolderRef.current) startHeartbeat();
		})();

		window.addEventListener("pagehide", handleHide);
		window.addEventListener("pageshow", handlePageShow);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			cancelled = true;
			stopHeartbeat();
			startHeartbeatRef.current = null;
			unsubscribeFromMutations();
			window.removeEventListener("pagehide", handleHide);
			window.removeEventListener("pageshow", handlePageShow);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			// Intentionally NOT releasing on unmount: step-to-step navigation
			// unmounts then remounts this hook, and a release racing the next step's
			// acquire would delete the freshly-taken lock (CONFLICT on the next
			// write). Release is handled by the pagehide/visibilitychange beacon
			// (tab close), logout, the inactivity timeout, and admin override.
			isHolderRef.current = false;
		};
	}, [
		declarationId,
		isEnabled,
		isImpersonating,
		modificationClosed,
		queryClient,
		session.status,
	]);

	useEffect(() => {
		if (!isWaitingForRefresh || isRefreshing) return;
		isAwaitingFreshDataRef.current = false;
		setIsWaitingForRefresh(false);
		setEditSessionKey((key) => key + 1);
		if (!isHolderRef.current) {
			setRetakeStatus("idle");
			return;
		}
		setIsReadOnly(false);
		setRetakeStatus("succeeded");
		startHeartbeatRef.current?.();
	}, [isRefreshing, isWaitingForRefresh]);

	const previousAvailableRef = useRef<boolean | null>(null);
	const { available } = availability;
	useEffect(() => {
		const previous = previousAvailableRef.current;
		previousAvailableRef.current = available;
		if (available === null || available === previous) return;
		if (available) {
			setRetakeStatus((status) =>
				status === "outpaced" || status === "failed" ? "idle" : status,
			);
			return;
		}
		setRetakeStatus((status) => (status === "failed" ? "idle" : status));
		if (previous !== true && holderRef.current !== null) return;
		void fetchLockStateRef
			.current({ declarationId }, { staleTime: 0 })
			.then((state) => {
				if (state.holder && !state.isOwnLock) setHolder(state.holder);
			})
			.catch(() => {});
	}, [available, declarationId]);

	const retake = useCallback(() => {
		const startHeartbeat = startHeartbeatRef.current;
		if (!startHeartbeat || isRetakeInFlightRef.current) return;
		isRetakeInFlightRef.current = true;
		setRetakeStatus("pending");
		const isStale = () => startHeartbeatRef.current !== startHeartbeat;

		void (async () => {
			try {
				const result = await acquireRef.current({ declarationId });
				if (isStale()) return;
				setHolder(result.holder);
				if (!result.acquired) {
					setRetakeStatus("outpaced");
					void recheckRef.current();
					return;
				}
				isHolderRef.current = true;
				isAwaitingFreshDataRef.current = true;
				await forgetAvailabilityRef.current();
				// The draft query never goes stale on its own, so only a full invalidation refreshes it.
				await queryClient.invalidateQueries();
				if (isStale()) return;
				setIsWaitingForRefresh(true);
				startRefresh(() => router.refresh());
			} catch {
				if (isStale()) return;
				isAwaitingFreshDataRef.current = false;
				setRetakeStatus("failed");
			} finally {
				isRetakeInFlightRef.current = false;
			}
		})();
	}, [declarationId, queryClient, router]);

	const displayedHolder =
		holder && isLockedOut && availability.lockTimeoutMinutes !== null
			? { ...holder, lockTimeoutMinutes: availability.lockTimeoutMinutes }
			: holder;

	return {
		isReadOnly,
		reason,
		holder: displayedHolder,
		isLoading,
		retake: {
			isAvailable: isLockedOut && available === true,
			status: retakeStatus,
			retake,
		},
		editSessionKey,
	};
}
