"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

export type LockHolder = {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
};

type LockState = {
	isReadOnly: boolean;
	holder: LockHolder | null;
};

const LockContext = createContext<LockState>({
	isReadOnly: false,
	holder: null,
});

type LockProviderProps = {
	children: ReactNode;
	isReadOnly?: boolean;
	holder?: LockHolder | null;
};

export function LockProvider({
	children,
	isReadOnly = false,
	holder = null,
}: LockProviderProps) {
	return (
		<LockContext.Provider value={{ isReadOnly, holder }}>
			{children}
		</LockContext.Provider>
	);
}

export function useLockContext(): LockState {
	return useContext(LockContext);
}
