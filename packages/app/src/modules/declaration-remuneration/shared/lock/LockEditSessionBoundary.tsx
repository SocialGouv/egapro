"use client";

import { Fragment, type ReactNode } from "react";

import { useReadOnlyContext } from "./LockContext";

type Props = {
	children: ReactNode;
};

export function LockEditSessionBoundary({ children }: Props) {
	const { editSessionKey = 0 } = useReadOnlyContext();
	return <Fragment key={editSessionKey}>{children}</Fragment>;
}
