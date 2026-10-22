"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { LOCK_HEARTBEAT_INTERVAL_MS } from "~/modules/domain";
import { api } from "~/trpc/react";
import {
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
	const isImpersonating = Boolean(session.data?.user?.impersonation);
	const canAcquire =
		session.status === "authenticated" &&
		!isImpersonating &&
		campaignOpen &&
		!isSubmitted;
	const [isReadOnly, setIsReadOnly] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [isUnavailable, setIsUnavailable] = useState(false);
	const [holder, setHolder] = useState<RepresentationLockHolder | null>(null);
	const ownsLockRef = useRef(false);
	const hasAttemptedRef = useRef(false);
	const acquireMutation =
		api.representationDeclaration.acquireLock.useMutation();
	const heartbeatMutation =
		api.representationDeclaration.heartbeat.useMutation();
	const acquireRef = useRef(acquireMutation.mutateAsync);
	const heartbeatRef = useRef(heartbeatMutation.mutateAsync);
	acquireRef.current = acquireMutation.mutateAsync;
	heartbeatRef.current = heartbeatMutation.mutateAsync;

	const releaseBeacon = useCallback(() => {
		if (!ownsLockRef.current) return;
		ownsLockRef.current = false;
		const body = new Blob([JSON.stringify({ year })], {
			type: "application/json",
		});
		navigator.sendBeacon(RELEASE_ENDPOINT, body);
	}, [year]);

	useEffect(() => {
		if (!canAcquire) {
			releaseBeacon();
			ownsLockRef.current = false;
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

		const scheduleAcquire = () => {
			clearRetry();
			retryId = setTimeout(() => void acquire(), LOCK_RETRY_INTERVAL_MS);
		};

		const startHeartbeat = () => {
			if (heartbeatId !== null) return;
			heartbeatId = setInterval(() => {
				void heartbeatRef
					.current({ year })
					.then((result) => {
						if (cancelled) return;
						if (result.held) return;
						ownsLockRef.current = false;
						setIsReadOnly(true);
						setHolder(null);
						if (heartbeatId !== null) clearInterval(heartbeatId);
						heartbeatId = null;
						void acquire();
					})
					.catch(() => {
						if (cancelled) return;
						ownsLockRef.current = false;
						setIsReadOnly(true);
						setIsUnavailable(true);
						if (heartbeatId !== null) clearInterval(heartbeatId);
						heartbeatId = null;
						scheduleAcquire();
					});
			}, LOCK_HEARTBEAT_INTERVAL_MS);
		};

		async function acquire() {
			clearRetry();
			try {
				const result = await acquireRef.current({ year });
				if (cancelled) return;
				const reacquired =
					result.acquired && hasAttemptedRef.current && !ownsLockRef.current;
				hasAttemptedRef.current = true;
				ownsLockRef.current = result.acquired;
				setIsReadOnly(!result.acquired);
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
				if (reacquired) router.refresh();
				if (result.acquired) startHeartbeat();
				else scheduleAcquire();
			} catch {
				if (cancelled) return;
				ownsLockRef.current = false;
				setIsReadOnly(true);
				setIsUnavailable(true);
				setHolder(null);
				scheduleAcquire();
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		const handleVisibility = () => {
			if (document.visibilityState === "hidden") {
				releaseBeacon();
				setIsReadOnly(true);
				setHolder(null);
				if (heartbeatId !== null) clearInterval(heartbeatId);
				heartbeatId = null;
				return;
			}
			void acquire();
		};
		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) void acquire();
		};

		void acquire();
		window.addEventListener("pagehide", releaseBeacon);
		window.addEventListener("pageshow", handlePageShow);
		document.addEventListener("visibilitychange", handleVisibility);

		return () => {
			cancelled = true;
			clearRetry();
			if (heartbeatId !== null) clearInterval(heartbeatId);
			window.removeEventListener("pagehide", releaseBeacon);
			window.removeEventListener("pageshow", handlePageShow);
			document.removeEventListener("visibilitychange", handleVisibility);
			// This provider sits at the funnel layout, so cleanup only runs when the
			// user leaves the whole declaration flow, not between steps.
			releaseBeacon();
		};
	}, [canAcquire, releaseBeacon, router, session.status, year]);

	return (
		<RepresentationLockContextProvider
			value={{
				isReadOnly: isReadOnly || isLoading,
				isLoading,
				isUnavailable,
				holder,
			}}
		>
			{children}
		</RepresentationLockContextProvider>
	);
}
