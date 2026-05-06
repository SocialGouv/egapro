"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { computeDraftDiff } from "./computeDraftDiff";
import type { DraftKind, DraftStep } from "./draftSchema";
import { clearDraft, readDraft, writeDraft } from "./draftStorage";

type UseDeclarationDraftOptions<T extends Record<string, unknown>> = {
	siren: string;
	year: number;
	step: DraftStep;
	kind: DraftKind;
	dbValues: T;
};

type UseDeclarationDraftResult<T extends Record<string, unknown>> = {
	draft: Partial<T>;
	setField: (currentValues: T) => void;
	clearDraft: () => void;
	hasDraft: boolean;
};

export function useDeclarationDraft<T extends Record<string, unknown>>(
	options: UseDeclarationDraftOptions<T>,
): UseDeclarationDraftResult<T> {
	const { siren, year, step, kind, dbValues } = options;
	const session = useSession();
	const userId = session.data?.user?.id ?? null;
	const isImpersonating = Boolean(session.data?.user?.impersonation);
	const isEnabled = userId !== null && !isImpersonating;

	const [draft, setDraft] = useState<Partial<T>>({});
	const [hasDraft, setHasDraft] = useState(false);

	useEffect(() => {
		if (!isEnabled || userId === null) return;
		const payload = readDraft(userId);
		if (payload === null) return;
		if (
			payload.siren !== siren ||
			payload.year !== year ||
			payload.step !== step
		) {
			return;
		}
		const fields = payload.fields as Partial<T>;
		setDraft(fields);
		setHasDraft(Object.keys(fields).length > 0);
	}, [isEnabled, userId, siren, year, step]);

	const setField = useCallback(
		(currentValues: T) => {
			if (!isEnabled || userId === null) return;
			const diff = computeDraftDiff(currentValues, dbValues);
			if (Object.keys(diff).length === 0) {
				clearDraft(userId);
				setHasDraft(false);
				return;
			}
			writeDraft(userId, {
				siren,
				year,
				step,
				kind,
				timestamp: Date.now(),
				fields: diff,
			});
			setHasDraft(true);
		},
		[isEnabled, userId, siren, year, step, kind, dbValues],
	);

	const clearDraftCallback = useCallback(() => {
		if (!isEnabled || userId === null) return;
		clearDraft(userId);
		setHasDraft(false);
	}, [isEnabled, userId]);

	return useMemo(
		() => ({
			draft,
			setField,
			clearDraft: clearDraftCallback,
			hasDraft,
		}),
		[draft, setField, clearDraftCallback, hasDraft],
	);
}
