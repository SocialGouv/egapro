"use client";

import { createContext, useContext } from "react";

import type { RepresentationDraft } from "~/modules/declaration-representation/types";

export type StepValidator = () => boolean | Promise<boolean>;

export type RepresentationDraftContextValue = {
	year: number;
	step: number;
	draft: RepresentationDraft;
	setDraftValues: (values: Partial<RepresentationDraft>) => void;
	isSaving: boolean;
	isPendingSave: boolean;
	isReadOnly: boolean;
	previousHref: string;
	registerStepValidator: (validator: StepValidator | null) => void;
};

const RepresentationDraftContext =
	createContext<RepresentationDraftContextValue | null>(null);

export function RepresentationDraftProvider({
	value,
	children,
}: {
	value: RepresentationDraftContextValue;
	children: React.ReactNode;
}) {
	return (
		<RepresentationDraftContext.Provider value={value}>
			{children}
		</RepresentationDraftContext.Provider>
	);
}

export function useRepresentationDraftContext(): RepresentationDraftContextValue {
	const context = useContext(RepresentationDraftContext);
	if (context === null) {
		throw new Error(
			"useRepresentationDraftContext doit être utilisé dans un RepresentationDraftProvider.",
		);
	}
	return context;
}
