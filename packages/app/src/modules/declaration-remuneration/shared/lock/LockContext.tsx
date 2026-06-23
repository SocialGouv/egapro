"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import { useDeclarationLock } from "./useDeclarationLock";

export type LockHolder = {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
};

type LockState = {
	isReadOnly: boolean;
	holder: LockHolder | null;
	isLoading?: boolean;
};

const LockContext = createContext<LockState>({
	isReadOnly: false,
	holder: null,
});

type StaticLockProviderProps = {
	children: ReactNode;
	isReadOnly?: boolean;
	holder?: LockHolder | null;
};

type DynamicLockProviderProps = {
	children: ReactNode;
	declarationId: string;
};

type LockProviderProps = StaticLockProviderProps | DynamicLockProviderProps;

function StaticLockProvider({
	children,
	isReadOnly = false,
	holder = null,
}: StaticLockProviderProps) {
	return (
		<LockContext.Provider value={{ isReadOnly, holder }}>
			{children}
		</LockContext.Provider>
	);
}

function DynamicLockProvider({
	children,
	declarationId,
}: DynamicLockProviderProps) {
	const { isReadOnly, holder, isLoading } = useDeclarationLock({
		declarationId,
	});
	return (
		<LockContext.Provider value={{ isReadOnly, holder, isLoading }}>
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

export function useLockContext(): LockState {
	return useContext(LockContext);
}
