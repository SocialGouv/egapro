"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
	LOCK_HEARTBEAT_INTERVAL_MS,
	REPRESENTATION_LOCK_CONFLICT_MESSAGE,
} from "~/modules/domain";
import { api } from "~/trpc/react";
import {
	ignorePendingSave,
	type PendingSaveFlush,
	RepresentationLockContextProvider,
	type RepresentationLockHolder,
} from "./RepresentationLockContext";

const RELEASE_ENDPOINT = "/api/representation-declaration-lock/release";
const LOCK_RETRY_INTERVAL_MS = LOCK_HEARTBEAT_INTERVAL_MS;

type Props = {
	year: number;
	campaignOpen: boolean;
	isSubmitted: boolean;
	enabled?: boolean;
	children: React.ReactNode;
};

function sendReleaseBeacon(year: number) {
	const body = new Blob([JSON.stringify({ year })], {
		type: "application/json",
	});
	navigator.sendBeacon(RELEASE_ENDPOINT, body);
}

function isForbiddenError(error: unknown): boolean {
	if (typeof error !== "object" || error === null || !("data" in error)) {
		return false;
	}
	const { data } = error;
	return (
		typeof data === "object" &&
		data !== null &&
		"code" in data &&
		data.code === "FORBIDDEN"
	);
}

function isTabHidden(): boolean {
	return document.visibilityState === "hidden";
}

export function RepresentationLockProvider({
	enabled = false,
	...props
}: Props) {
	if (!enabled) {
		return (
			<RepresentationLockContextProvider
				value={{
					isReadOnly: true,
					isLoading: false,
					isUnavailable: false,
					holder: null,
					registerPendingSave: ignorePendingSave,
				}}
			>
				{props.children}
			</RepresentationLockContextProvider>
		);
	}
	return <ManagedRepresentationLockProvider {...props} />;
}

function ManagedRepresentationLockProvider({
	year,
	campaignOpen,
	isSubmitted,
	children,
}: Omit<Props, "enabled">) {
	const router = useRouter();
	const session = useSession();
	const queryClient = useQueryClient();
	const isImpersonating = Boolean(session.data?.user?.impersonation);
	const canAcquire =
		session.status === "authenticated" &&
		!isImpersonating &&
		campaignOpen &&
		!isSubmitted;
	const [isReadOnly, setIsReadOnly] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [isUnavailable, setIsUnavailable] = useState(false);
	const [isWaitingForRefresh, setIsWaitingForRefresh] = useState(false);
	const [isRefreshing, startRefresh] = useTransition();
	const [holder, setHolder] = useState<RepresentationLockHolder | null>(null);
	const ownsLockRef = useRef(false);
	const hasAttemptedRef = useRef(false);
	const attemptSequenceRef = useRef(0);
	const liveAttemptRef = useRef(0);
	const pendingSaveRef = useRef<PendingSaveFlush | null>(null);
	const acquireMutation =
		api.representationDeclaration.acquireLock.useMutation();
	const heartbeatMutation =
		api.representationDeclaration.heartbeat.useMutation();
	const acquireRef = useRef(acquireMutation.mutateAsync);
	const heartbeatRef = useRef(heartbeatMutation.mutateAsync);
	acquireRef.current = acquireMutation.mutateAsync;
	heartbeatRef.current = heartbeatMutation.mutateAsync;

	useEffect(() => {
		if (!isWaitingForRefresh || isRefreshing) return;
		setIsWaitingForRefresh(false);
		if (ownsLockRef.current && !isTabHidden()) setIsReadOnly(false);
	}, [isRefreshing, isWaitingForRefresh]);

	const registerPendingSave = useCallback((flush: PendingSaveFlush) => {
		pendingSaveRef.current = flush;
		return () => {
			if (pendingSaveRef.current === flush) pendingSaveRef.current = null;
		};
	}, []);

	const releaseBeacon = useCallback(() => {
		if (!ownsLockRef.current) return;
		ownsLockRef.current = false;
		sendReleaseBeacon(year);
	}, [year]);

	useEffect(() => {
		if (!canAcquire) {
			liveAttemptRef.current = 0;
			releaseBeacon();
			setIsReadOnly(true);
			setIsUnavailable(false);
			setHolder(null);
			setIsLoading(session.status === "loading");
			return;
		}

		let cancelled = false;
		let heartbeatId: ReturnType<typeof setInterval> | null = null;
		let retryId: ReturnType<typeof setTimeout> | null = null;

		const clearRetry = () => {
			if (retryId !== null) clearTimeout(retryId);
			retryId = null;
		};

		const stopHeartbeat = () => {
			if (heartbeatId !== null) clearInterval(heartbeatId);
			heartbeatId = null;
		};

		const scheduleAcquire = () => {
			clearRetry();
			retryId = setTimeout(() => void acquire(), LOCK_RETRY_INTERVAL_MS);
		};

		const loseLock = () => {
			ownsLockRef.current = false;
			setIsReadOnly(true);
			setHolder(null);
			stopHeartbeat();
		};

		const startHeartbeat = () => {
			if (heartbeatId !== null) return;
			heartbeatId = setInterval(() => {
				void heartbeatRef
					.current({ year })
					.then((result) => {
						if (cancelled || result.held) return;
						loseLock();
						void acquire();
					})
					.catch(() => {
						if (cancelled) return;
						loseLock();
						setIsUnavailable(true);
						scheduleAcquire();
					});
			}, LOCK_HEARTBEAT_INTERVAL_MS);
		};

		async function acquire() {
			clearRetry();
			if (isTabHidden()) return;
			const attempt = ++attemptSequenceRef.current;
			liveAttemptRef.current = attempt;
			try {
				const result = await acquireRef.current({ year });
				if (cancelled || liveAttemptRef.current !== attempt) {
					if (
						result.acquired &&
						liveAttemptRef.current === 0 &&
						!ownsLockRef.current
					) {
						sendReleaseBeacon(year);
					}
					return;
				}
				liveAttemptRef.current = 0;
				const reacquired =
					result.acquired && hasAttemptedRef.current && !ownsLockRef.current;
				hasAttemptedRef.current = true;
				ownsLockRef.current = result.acquired;
				setIsReadOnly(!result.acquired || reacquired);
				setIsUnavailable(false);
				setHolder(
					result.acquired
						? null
						: {
								firstName: result.holder.firstName,
								lastName: result.holder.lastName,
								email: result.holder.email,
							},
				);
				if (reacquired) {
					setIsWaitingForRefresh(true);
					startRefresh(() => router.refresh());
				}
				if (result.acquired) startHeartbeat();
				else scheduleAcquire();
			} catch (error) {
				if (cancelled || liveAttemptRef.current !== attempt) return;
				liveAttemptRef.current = 0;
				ownsLockRef.current = false;
				setIsReadOnly(true);
				setHolder(null);
				if (isForbiddenError(error)) {
					setIsUnavailable(false);
					router.refresh();
					return;
				}
				setIsUnavailable(true);
				scheduleAcquire();
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		const handleHidden = () => {
			liveAttemptRef.current = 0;
			clearRetry();
			stopHeartbeat();
			const hiddenAtAttempt = attemptSequenceRef.current;
			const pendingSave = pendingSaveRef.current?.() ?? null;
			setIsReadOnly(true);
			setHolder(null);
			if (pendingSave === null) {
				releaseBeacon();
				return;
			}
			void pendingSave.finally(() => {
				if (cancelled || attemptSequenceRef.current !== hiddenAtAttempt) return;
				releaseBeacon();
			});
		};

		const handleVisibility = () => {
			if (isTabHidden()) {
				handleHidden();
				return;
			}
			void acquire();
		};
		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) void acquire();
		};

		const unsubscribeFromMutations = queryClient
			.getMutationCache()
			.subscribe((event) => {
				if (event.type !== "updated" || event.action.type !== "error") return;
				const error = event.action.error;
				if (
					cancelled ||
					!(error instanceof Error) ||
					error.message !== REPRESENTATION_LOCK_CONFLICT_MESSAGE
				) {
					return;
				}
				loseLock();
				void acquire();
			});

		void acquire();
		window.addEventListener("pagehide", releaseBeacon);
		window.addEventListener("pageshow", handlePageShow);
		document.addEventListener("visibilitychange", handleVisibility);

		return () => {
			cancelled = true;
			liveAttemptRef.current = 0;
			clearRetry();
			stopHeartbeat();
			unsubscribeFromMutations();
			window.removeEventListener("pagehide", releaseBeacon);
			window.removeEventListener("pageshow", handlePageShow);
			document.removeEventListener("visibilitychange", handleVisibility);
			releaseBeacon();
		};
	}, [canAcquire, queryClient, releaseBeacon, router, session.status, year]);

	return (
		<RepresentationLockContextProvider
			value={{
				isReadOnly: isReadOnly || isLoading,
				isLoading,
				isUnavailable,
				holder,
				registerPendingSave,
			}}
		>
			{children}
		</RepresentationLockContextProvider>
	);
}
