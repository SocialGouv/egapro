import type { ReactNode } from "react";

import {
	RepresentationLockContextProvider,
	type RepresentationLockState,
} from "../shared/lock/RepresentationLockContext";

export const LOCK_HELD: RepresentationLockState = {
	isReadOnly: false,
	isLoading: false,
	isUnavailable: false,
	holder: null,
};

export const LOCKED_BY_OTHER: RepresentationLockState = {
	isReadOnly: true,
	isLoading: false,
	isUnavailable: false,
	holder: {
		firstName: "Camille",
		lastName: "Martin",
		email: "camille.martin@example.fr",
	},
};

export function lockWrapper(state: RepresentationLockState = LOCK_HELD) {
	return function RepresentationLockWrapper({
		children,
	}: {
		children: ReactNode;
	}) {
		return (
			<RepresentationLockContextProvider value={state}>
				{children}
			</RepresentationLockContextProvider>
		);
	};
}
