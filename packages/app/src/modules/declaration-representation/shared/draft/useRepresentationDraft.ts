"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "~/trpc/react";
import type { RepresentationDraft } from "../../types";

const DEBOUNCE_MS = 600;
const VISUAL_DELAY_MS = 400;

type UseRepresentationDraftOptions = {
	year: number;
	step: number;
	initialDraft: RepresentationDraft;
	enabled?: boolean;
};

type UseRepresentationDraftResult = {
	draft: RepresentationDraft;
	setDraftValues: (values: Partial<RepresentationDraft>) => void;
	saveProgress: (currentStep: number) => Promise<void>;
	isSaving: boolean;
	isPendingSave: boolean;
};

export function useRepresentationDraft({
	year,
	step,
	initialDraft,
	enabled = true,
}: UseRepresentationDraftOptions): UseRepresentationDraftResult {
	const [draft, setDraft] = useState<RepresentationDraft>(initialDraft);
	const [isPendingSave, setIsPendingSave] = useState(false);

	const mutation = api.representationDeclaration.saveDraft.useMutation();

	const contextRef = useRef({
		year,
		enabled,
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
	});
	contextRef.current = {
		year,
		enabled,
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
	};

	const draftRef = useRef(draft);
	draftRef.current = draft;

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const visualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingRef = useRef<RepresentationDraft | null>(null);

	const cancelTimers = useCallback(() => {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		if (visualTimerRef.current !== null) {
			clearTimeout(visualTimerRef.current);
			visualTimerRef.current = null;
		}
	}, []);

	const flush = useCallback(() => {
		cancelTimers();
		setIsPendingSave(false);
		const pending = pendingRef.current;
		pendingRef.current = null;
		if (pending === null || !contextRef.current.enabled) return;
		contextRef.current.mutate({
			year: contextRef.current.year,
			draft: pending,
			currentStep: pending.currentStep,
		});
	}, [cancelTimers]);

	const flushRef = useRef(flush);
	flushRef.current = flush;

	useEffect(() => {
		return () => {
			flushRef.current();
		};
	}, []);

	const setDraftValues = useCallback(
		(values: Partial<RepresentationDraft>) => {
			const next: RepresentationDraft = {
				...draftRef.current,
				...values,
				currentStep: Math.max(draftRef.current.currentStep, step),
			};
			draftRef.current = next;
			setDraft(next);
			if (!contextRef.current.enabled) return;
			pendingRef.current = next;
			cancelTimers();
			visualTimerRef.current = setTimeout(() => {
				visualTimerRef.current = null;
				setIsPendingSave(true);
			}, VISUAL_DELAY_MS);
			timerRef.current = setTimeout(() => {
				timerRef.current = null;
				flushRef.current();
			}, DEBOUNCE_MS);
		},
		[cancelTimers, step],
	);

	const saveProgress = useCallback(
		async (currentStep: number) => {
			cancelTimers();
			setIsPendingSave(false);
			pendingRef.current = null;
			const next: RepresentationDraft = { ...draftRef.current, currentStep };
			draftRef.current = next;
			setDraft(next);
			if (!contextRef.current.enabled) return;
			await contextRef.current.mutateAsync({
				year: contextRef.current.year,
				draft: next,
				currentStep,
			});
		},
		[cancelTimers],
	);

	return {
		draft,
		setDraftValues,
		saveProgress,
		isSaving: mutation.isPending,
		isPendingSave,
	};
}
