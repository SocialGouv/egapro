"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "~/trpc/react";

import { computeDraftDiff } from "./computeDraftDiff";
import type { DraftKind, DraftStep } from "./draftSchema";

type DraftBlob = Record<string, Record<string, unknown>>;

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
	isLoadingDraft: boolean;
};

const DEBOUNCE_MS = 600;

export function useDeclarationDraft<T extends Record<string, unknown>>(
	options: UseDeclarationDraftOptions<T>,
): UseDeclarationDraftResult<T> {
	const { siren, year, step, kind, dbValues } = options;
	const session = useSession();
	const userId = session.data?.user?.id ?? null;
	const isImpersonating = Boolean(session.data?.user?.impersonation);
	const isEnabled = userId !== null && !isImpersonating;

	const utils = api.useUtils();
	const query = api.declarationDraft.get.useQuery(
		{ year, siren },
		{ staleTime: Infinity, enabled: isEnabled },
	);

	const stepKey = String(step);

	const { mutate: saveMutate } = api.declarationDraft.save.useMutation({
		onSuccess: (_data, variables) => {
			utils.declarationDraft.get.setData(
				{ year: variables.year, siren: variables.siren },
				(old) => {
					const base = (old ?? {}) as DraftBlob;
					const slice = (base[variables.slice.kind] ?? {}) as Record<
						string,
						unknown
					>;
					return {
						...base,
						[variables.slice.kind]: {
							...slice,
							[variables.slice.step]: variables.slice.data,
						},
					};
				},
			);
		},
	});

	const { mutate: clearMutate } = api.declarationDraft.clear.useMutation({
		onSuccess: (_data, variables) => {
			utils.declarationDraft.get.setData(
				{ year: variables.year, siren: variables.siren },
				(old) => {
					if (!old) return old;
					const base = old as DraftBlob;
					if (variables.kind === undefined) return null;
					const { [variables.kind]: _removed, ...rest } = base;
					return Object.keys(rest).length === 0 ? null : (rest as DraftBlob);
				},
			);
		},
	});

	const [localDraft, setLocalDraft] = useState<Partial<T> | null>(null);

	const queryDraft = useMemo<Partial<T> | null>(() => {
		const data = query.data as DraftBlob | null | undefined;
		if (!data) return null;
		const slice = data[kind];
		if (!slice) return null;
		const stepData = slice[stepKey];
		if (!stepData) return null;
		return stepData as Partial<T>;
	}, [query.data, kind, stepKey]);

	const draft: Partial<T> = localDraft ?? queryDraft ?? {};
	const hasDraft = Object.keys(draft).length > 0;

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingRef = useRef<{ diff: Record<string, unknown> | null } | null>(
		null,
	);
	const flushRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		flushRef.current = () => {
			if (timerRef.current === null) return;
			clearTimeout(timerRef.current);
			timerRef.current = null;
			const pending = pendingRef.current;
			pendingRef.current = null;
			if (pending === null || !isEnabled) return;
			if (pending.diff === null) {
				clearMutate({ year, siren, kind });
			} else {
				saveMutate({
					year,
					siren,
					slice: { kind, step: stepKey, data: pending.diff },
				});
			}
		};
	});

	const setField = useCallback(
		(currentValues: T) => {
			if (!isEnabled) return;
			const diff = computeDraftDiff(currentValues, dbValues);
			const hasDiff = Object.keys(diff).length > 0;
			setLocalDraft(hasDiff ? (diff as Partial<T>) : ({} as Partial<T>));
			if (timerRef.current !== null) clearTimeout(timerRef.current);
			pendingRef.current = { diff: hasDiff ? diff : null };
			timerRef.current = setTimeout(() => {
				timerRef.current = null;
				pendingRef.current = null;
				if (hasDiff) {
					saveMutate({
						year,
						siren,
						slice: { kind, step: stepKey, data: diff },
					});
				} else {
					clearMutate({ year, siren, kind });
				}
			}, DEBOUNCE_MS);
		},
		[isEnabled, siren, year, kind, stepKey, dbValues, saveMutate, clearMutate],
	);

	const clearDraftCallback = useCallback(() => {
		if (!isEnabled) return;
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
			pendingRef.current = null;
		}
		setLocalDraft({} as Partial<T>);
		clearMutate({ year, siren, kind });
	}, [isEnabled, siren, year, kind, clearMutate]);

	useEffect(() => {
		return () => {
			flushRef.current?.();
		};
	}, []);

	return useMemo(
		() => ({
			draft,
			setField,
			clearDraft: clearDraftCallback,
			hasDraft,
			isLoadingDraft: isEnabled ? query.isLoading : false,
		}),
		[draft, setField, clearDraftCallback, hasDraft, query.isLoading, isEnabled],
	);
}
