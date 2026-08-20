"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import {
	DECLARATION_LOCK_CONFLICT_MESSAGE,
	LOCK_HEARTBEAT_INTERVAL_MS,
} from "~/modules/domain";
import { api, type RouterOutputs } from "~/trpc/react";

export type LockHolder = NonNullable<
	RouterOutputs["declarationLock"]["getLockState"]["holder"]
>;

export type ReadOnlyReason = "impersonation" | "modification_closed" | "lock";

export type DeclarationLockState = {
	isReadOnly: boolean;
	reason: ReadOnlyReason | null;
	holder: LockHolder | null;
	isLoading: boolean;
};

type UseDeclarationLockOptions = {
	declarationId: string;
	modificationClosed?: boolean;
};

const RELEASE_ENDPOINT = "/api/declaration-lock/release";

export function useDeclarationLock({
	declarationId,
	modificationClosed = false,
}: UseDeclarationLockOptions): DeclarationLockState {
	const session = useSession();
	const queryClient = useQueryClient();
	const isImpersonating = Boolean(session.data?.user?.impersonation);
	const isEnabled =
		session.status === "authenticated" &&
		!isImpersonating &&
		!modificationClosed;

	const [holder, setHolder] = useState<LockHolder | null>(null);
	const [isReadOnly, setIsReadOnly] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const acquire = api.declarationLock.acquireLock.useMutation();
	const heartbeat = api.declarationLock.heartbeat.useMutation();

	const acquireRef = useRef(acquire.mutateAsync);
	const heartbeatRef = useRef(heartbeat.mutateAsync);
	acquireRef.current = acquire.mutateAsync;
	heartbeatRef.current = heartbeat.mutateAsync;

	// Tracks whether *this* tab currently holds the editor lock, read by the
	// pagehide beacon and the unmount cleanup without re-running the effect.
	const isHolderRef = useRef(false);

	useEffect(() => {
		if (!isEnabled) {
			isHolderRef.current = false;
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
				setIsReadOnly(!result.acquired);
				setHolder(result.holder);
				if (!result.acquired) stopHeartbeat();
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
							setIsReadOnly(false);
							return;
						}
						// Lock lost (expired or taken over): re-read the current holder.
						void refreshOwnership();
					})
					.catch(() => {});
			}, LOCK_HEARTBEAT_INTERVAL_MS);
		};

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
			void reconcileOwnership();
		};

		// Symmetric to the `pagehide` beacon: a bfcache restore resumes a page
		// whose lock was released on the way out.
		const handlePageShow = (event: PageTransitionEvent) => {
			if (!event.persisted) return;
			void reconcileOwnership();
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
				void reconcileOwnership();
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

	const reason: ReadOnlyReason | null = isImpersonating
		? "impersonation"
		: modificationClosed
			? "modification_closed"
			: isReadOnly
				? "lock"
				: null;

	return { isReadOnly, reason, holder, isLoading };
}
