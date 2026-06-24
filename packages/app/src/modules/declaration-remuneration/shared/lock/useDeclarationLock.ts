"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { LOCK_HEARTBEAT_INTERVAL_MS } from "~/modules/domain";
import { api, type RouterOutputs } from "~/trpc/react";

export type LockHolder = NonNullable<
	RouterOutputs["declarationLock"]["getLockState"]["holder"]
>;

export type DeclarationLockState = {
	isReadOnly: boolean;
	holder: LockHolder | null;
	isLoading: boolean;
};

type UseDeclarationLockOptions = {
	declarationId: string;
};

const RELEASE_ENDPOINT = "/api/declaration-lock/release";

export function useDeclarationLock({
	declarationId,
}: UseDeclarationLockOptions): DeclarationLockState {
	const session = useSession();
	const isImpersonating = Boolean(session.data?.user?.impersonation);
	const isEnabled = session.status === "authenticated" && !isImpersonating;

	const [holder, setHolder] = useState<LockHolder | null>(null);
	const [isReadOnly, setIsReadOnly] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const acquire = api.declarationLock.acquireLock.useMutation();
	const heartbeat = api.declarationLock.heartbeat.useMutation();
	const release = api.declarationLock.releaseLock.useMutation();

	const acquireRef = useRef(acquire.mutateAsync);
	const heartbeatRef = useRef(heartbeat.mutateAsync);
	const releaseRef = useRef(release.mutate);
	acquireRef.current = acquire.mutateAsync;
	heartbeatRef.current = heartbeat.mutateAsync;
	releaseRef.current = release.mutate;

	// Tracks whether *this* tab currently holds the editor lock, read by the
	// pagehide beacon and the unmount cleanup without re-running the effect.
	const isHolderRef = useRef(false);

	useEffect(() => {
		if (!isEnabled) {
			isHolderRef.current = false;
			setIsReadOnly(false);
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
						if (cancelled || result.held) return;
						// Lock lost (expired or taken over): re-read the current holder.
						void refreshOwnership();
					})
					.catch(() => {});
			}, LOCK_HEARTBEAT_INTERVAL_MS);
		};

		const handleHide = () => {
			if (!isHolderRef.current) return;
			const payload = JSON.stringify({ declarationId });
			const blob = new Blob([payload], { type: "application/json" });
			navigator.sendBeacon(RELEASE_ENDPOINT, blob);
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") handleHide();
		};

		setIsLoading(true);
		void (async () => {
			await refreshOwnership();
			if (cancelled) return;
			setIsLoading(false);
			if (isHolderRef.current) startHeartbeat();
		})();

		window.addEventListener("pagehide", handleHide);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			cancelled = true;
			stopHeartbeat();
			window.removeEventListener("pagehide", handleHide);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			if (isHolderRef.current) {
				isHolderRef.current = false;
				releaseRef.current({ declarationId });
			}
		};
	}, [declarationId, isEnabled, session.status]);

	return { isReadOnly, holder, isLoading };
}
