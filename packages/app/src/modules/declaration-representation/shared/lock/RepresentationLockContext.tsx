"use client";

import { createContext, useContext } from "react";

export type RepresentationLockHolder = {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
};

export type RepresentationLockState = {
	isReadOnly: boolean;
	isLoading: boolean;
	isUnavailable: boolean;
	holder: RepresentationLockHolder | null;
};

const RepresentationLockContext = createContext<RepresentationLockState | null>(
	null,
);

export function RepresentationLockContextProvider({
	value,
	children,
}: {
	value: RepresentationLockState;
	children: React.ReactNode;
}) {
	return (
		<RepresentationLockContext.Provider value={value}>
			{children}
		</RepresentationLockContext.Provider>
	);
}

export function useRepresentationLock(): RepresentationLockState {
	const context = useContext(RepresentationLockContext);
	if (context === null) {
		throw new Error(
			"useRepresentationLock doit être utilisé dans RepresentationLockContextProvider.",
		);
	}
	return context;
}
