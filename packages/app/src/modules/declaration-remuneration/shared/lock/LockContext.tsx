"use client";

import { createContext, useContext } from "react";

import {
	type DeclarationLockState,
	useDeclarationLock,
} from "./useDeclarationLock";

const LockContext = createContext<DeclarationLockState | null>(null);

type LockProviderProps = {
	declarationId: string;
	children: React.ReactNode;
};

export function LockProvider({ declarationId, children }: LockProviderProps) {
	const state = useDeclarationLock({ declarationId });
	return <LockContext.Provider value={state}>{children}</LockContext.Provider>;
}

export function useLockContext(): DeclarationLockState {
	const context = useContext(LockContext);
	if (context === null) {
		throw new Error("useLockContext must be used within a LockProvider");
	}
	return context;
}
