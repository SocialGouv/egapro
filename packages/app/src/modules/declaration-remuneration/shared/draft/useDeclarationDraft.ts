"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "~/trpc/react";

import { computeDraftDiff, deepEqual } from "./computeDraftDiff";
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
	isSaving: boolean;
	isPendingSave: boolean;
};

const DEBOUNCE_MS = 600;
const VISUAL_DELAY_MS = 400;
const EMPTY_DRAFT: Readonly<Record<string, never>> = Object.freeze({});

export function useDeclarationDraft<T extends Record<string, unknown>>(
	options: UseDeclarationDraftOptions<T>,
): UseDeclarationDraftResult<T> {
	const { siren, year, step, kind, dbValues } = options;
	const session = useSession();
	const isSessionLoading = session.status === "loading";
	const userId = session.data?.user?.id ?? null;
	const isImpersonating = Boolean(session.data?.user?.impersonation);
	const isEnabled = userId !== null && !isImpersonating;

	const utils = api.useUtils();
	const query = api.declarationDraft.get.useQuery(
		{ year, siren },
		{ staleTime: Infinity, enabled: isEnabled },
	);

	const stepKey = String(step);

	const saveMutation = api.declarationDraft.save.useMutation({
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

	const clearMutation = api.declarationDraft.clear.useMutation({
		onSuccess: (_data, variables) => {
			utils.declarationDraft.get.setData(
				{ year: variables.year, siren: variables.siren },
				(old) => {
					if (!old) return old;
					const base = old as DraftBlob;
					if (variables.kind === undefined) return null;
					if (variables.step !== undefined) {
						const kindData = (base[variables.kind] ?? {}) as Record<
							string,
							unknown
						>;
						const { [variables.step]: _removedStep, ...remainingSteps } =
							kindData;
						if (Object.keys(remainingSteps).length === 0) {
							const { [variables.kind]: _removedKind, ...remainingKinds } =
								base;
							return Object.keys(remainingKinds).length === 0
								? null
								: (remainingKinds as DraftBlob);
						}
						return { ...base, [variables.kind]: remainingSteps };
					}
					const { [variables.kind]: _removed, ...rest } = base;
					return Object.keys(rest).length === 0 ? null : (rest as DraftBlob);
				},
			);
		},
	});

	const saveMutateRef = useRef(saveMutation.mutate);
	const clearMutateRef = useRef(clearMutation.mutate);
	saveMutateRef.current = saveMutation.mutate;
	clearMutateRef.current = clearMutation.mutate;

	const [localDraft, setLocalDraft] = useState<Partial<T> | null>(null);
	const [isPendingSave, setIsPendingSave] = useState(false);

	const queryDraft = useMemo<Partial<T> | null>(() => {
		const data = query.data as DraftBlob | null | undefined;
		if (!data) return null;
		const slice = data[kind];
		if (!slice) return null;
		const stepData = slice[stepKey];
		if (!stepData) return null;
		return stepData as Partial<T>;
	}, [query.data, kind, stepKey]);

	// Prevents hasDraft from flickering to false when a clearMutation from a
	// previous mount resolves after the new mount has already hydrated the form.
	// Set via effect so it only fires when queryDraft actually changes, preventing
	// render-time re-override of the false set by setField/clearDraft callbacks.
	const hadQueryDraftRef = useRef(false);
	useEffect(() => {
		if (queryDraft !== null && Object.keys(queryDraft).length > 0) {
			hadQueryDraftRef.current = true;
		}
	}, [queryDraft]);

	const draft: Partial<T> =
		localDraft ?? queryDraft ?? (EMPTY_DRAFT as Partial<T>);
	const localIsExplicitlyEmpty =
		localDraft !== null && Object.keys(localDraft).length === 0;
	const hasDraft =
		!localIsExplicitlyEmpty &&
		((queryDraft !== null && Object.keys(queryDraft).length > 0) ||
			hadQueryDraftRef.current);

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const visualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingRef = useRef<{ diff: Record<string, unknown> | null } | null>(
		null,
	);
	const flushRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		flushRef.current = () => {
			if (visualTimerRef.current !== null) {
				clearTimeout(visualTimerRef.current);
				visualTimerRef.current = null;
			}
			if (timerRef.current === null) return;
			clearTimeout(timerRef.current);
			timerRef.current = null;
			setIsPendingSave(false);
			const pending = pendingRef.current;
			pendingRef.current = null;
			if (pending === null || !isEnabled) return;
			if (pending.diff === null) {
				// Immediately reflect the clear in the cache so the next mount sees null,
				// not stale data that the in-flight mutation will remove later.
				utils.declarationDraft.get.setData({ year, siren }, (old) => {
					if (!old) return old;
					const base = old as DraftBlob;
					const kindData = (base[kind] ?? {}) as Record<string, unknown>;
					const { [stepKey]: _removedStep, ...remainingSteps } = kindData;
					if (Object.keys(remainingSteps).length === 0) {
						const { [kind]: _removedKind, ...remainingKinds } = base;
						return Object.keys(remainingKinds).length === 0
							? null
							: (remainingKinds as DraftBlob);
					}
					return { ...base, [kind]: remainingSteps };
				});
				clearMutateRef.current({ year, siren, kind, step: stepKey });
			} else {
				// Immediately reflect the save in the cache so the next mount hydrates
				// with the correct data before the in-flight mutation resolves.
				utils.declarationDraft.get.setData({ year, siren }, (old) => {
					const base = (old ?? {}) as DraftBlob;
					const slice = (base[kind] ?? {}) as Record<string, unknown>;
					return {
						...base,
						[kind]: { ...slice, [stepKey]: pending.diff },
					};
				});
				saveMutateRef.current({
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
			if (!hasDiff) hadQueryDraftRef.current = false;
			setLocalDraft((prev) => {
				const next = hasDiff
					? (diff as Partial<T>)
					: (EMPTY_DRAFT as Partial<T>);
				if (prev !== null && deepEqual(prev, next)) {
					return prev;
				}
				return next;
			});
			if (timerRef.current !== null) clearTimeout(timerRef.current);
			if (visualTimerRef.current !== null) clearTimeout(visualTimerRef.current);
			pendingRef.current = { diff: hasDiff ? diff : null };
			visualTimerRef.current = setTimeout(() => {
				visualTimerRef.current = null;
				setIsPendingSave(true);
			}, VISUAL_DELAY_MS);
			timerRef.current = setTimeout(() => {
				timerRef.current = null;
				pendingRef.current = null;
				setIsPendingSave(false);
				if (hasDiff) {
					saveMutateRef.current({
						year,
						siren,
						slice: { kind, step: stepKey, data: diff },
					});
				} else {
					clearMutateRef.current({ year, siren, kind, step: stepKey });
				}
			}, DEBOUNCE_MS);
		},
		[isEnabled, siren, year, kind, stepKey, dbValues],
	);

	const clearDraftCallback = useCallback(() => {
		if (!isEnabled) return;
		hadQueryDraftRef.current = false;
		if (visualTimerRef.current !== null) {
			clearTimeout(visualTimerRef.current);
			visualTimerRef.current = null;
		}
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
			pendingRef.current = null;
			setIsPendingSave(false);
		}
		setLocalDraft((prev) => {
			if (prev !== null && Object.keys(prev).length === 0) return prev;
			return EMPTY_DRAFT as Partial<T>;
		});
		clearMutateRef.current({ year, siren, kind, step: stepKey });
	}, [isEnabled, siren, year, kind, stepKey]);

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
			isLoadingDraft:
				isSessionLoading || (isEnabled && query.data === undefined),
			isSaving: saveMutation.isPending,
			isPendingSave,
		}),
		[
			draft,
			setField,
			clearDraftCallback,
			hasDraft,
			query.data,
			isEnabled,
			isSessionLoading,
			saveMutation.isPending,
			isPendingSave,
		],
	);
}
