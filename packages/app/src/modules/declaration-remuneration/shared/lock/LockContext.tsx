"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import { useIsImpersonating } from "~/modules/auth";
import type { ReadOnlyReason } from "./useDeclarationLock";
import { useDeclarationLock } from "./useDeclarationLock";

export type LockHolder = {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
};

type LockState = {
	isReadOnly: boolean;
	reason: ReadOnlyReason | null;
	holder: LockHolder | null;
	isLoading?: boolean;
};

const LockContext = createContext<LockState>({
	isReadOnly: false,
	reason: null,
	holder: null,
});

type StaticLockProviderProps = {
	children: ReactNode;
	isReadOnly?: boolean;
	reason?: ReadOnlyReason | null;
	holder?: LockHolder | null;
};

type DynamicLockProviderProps = {
	children: ReactNode;
	declarationId: string;
	modificationClosed?: boolean;
};

type LockProviderProps = StaticLockProviderProps | DynamicLockProviderProps;

function StaticLockProvider({
	children,
	isReadOnly = false,
	reason,
	holder = null,
}: StaticLockProviderProps) {
	// Impersonation is read-only too, but the layouts feed this provider from
	// `getLockReadState` (lock only, no impersonation). Fold it in here so the
	// unified context disables writes on the static path the same way the
	// dynamic provider does — without re-wiring each consumer or touching the
	// back (the lock stays server-disabled during impersonation).
	const isImpersonating = useIsImpersonating();
	const resolvedReason: ReadOnlyReason | null = isImpersonating
		? "impersonation"
		: (reason ?? (holder != null ? "lock" : null));
	return (
		<LockContext.Provider
			value={{
				isReadOnly: isReadOnly || isImpersonating,
				reason: resolvedReason,
				holder: isImpersonating ? null : holder,
			}}
		>
			{children}
		</LockContext.Provider>
	);
}

function DynamicLockProvider({
	children,
	declarationId,
	modificationClosed,
}: DynamicLockProviderProps) {
	const { isReadOnly, reason, holder, isLoading } = useDeclarationLock({
		declarationId,
		modificationClosed,
	});
	return (
		<LockContext.Provider value={{ isReadOnly, reason, holder, isLoading }}>
			{children}
		</LockContext.Provider>
	);
}

export function LockProvider(props: LockProviderProps) {
	if ("declarationId" in props) {
		return <DynamicLockProvider {...props} />;
	}
	return <StaticLockProvider {...props} />;
}

export function useReadOnlyContext(): LockState {
	return useContext(LockContext);
}

export const useLockContext = useReadOnlyContext;
