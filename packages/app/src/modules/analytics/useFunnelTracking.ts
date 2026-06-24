"use client";

import { useEffect } from "react";

import type { FunnelConfig } from "./shared/events";
import { MATOMO_FUNNEL_ACTION } from "./shared/events";
import { trackEvent } from "./trackEvent";

// State is persisted in `sessionStorage` so step transitions and abandons
// survive the full page navigation between wizard steps.

type FunnelState = {
	startedAt: number;
	stepEnteredAt: number;
	currentStep: number;
};

type FunnelTrackingContext = {
	step: number;
	// Anonymised dimensions only — never PII.
	dimensions?: Record<number, string>;
};

function firstStepOf(config: FunnelConfig): number {
	return config.firstStep ?? 1;
}

function lastStepOf(config: FunnelConfig): number {
	return config.lastStep ?? config.stepKeys.length - 1;
}

function readState(storageKey: string): FunnelState | null {
	if (typeof window === "undefined") return null;
	const raw = sessionStorage.getItem(storageKey);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as FunnelState;
	} catch {
		return null;
	}
}

function writeState(storageKey: string, state: FunnelState): void {
	if (typeof window === "undefined") return;
	sessionStorage.setItem(storageKey, JSON.stringify(state));
}

function clearState(storageKey: string): void {
	if (typeof window === "undefined") return;
	sessionStorage.removeItem(storageKey);
}

// Exported so non-funnel client instrumentation (e.g. category import
// duration) can reuse the same elapsed-seconds rounding instead of duplicating it.
export function elapsedSeconds(from: number, to: number): number {
	return Math.round((to - from) / 1000);
}

function handleStepEnter(
	config: FunnelConfig,
	step: number,
	dimensions?: Record<number, string>,
): void {
	if (step < firstStepOf(config) || step > lastStepOf(config)) return;

	const now = Date.now();
	const state = readState(config.storageKey);

	if (!state) {
		if (step === firstStepOf(config)) {
			trackEvent({
				category: config.category,
				action: MATOMO_FUNNEL_ACTION.FUNNEL_START,
				dimensions,
			});
		}
		writeState(config.storageKey, {
			startedAt: now,
			stepEnteredAt: now,
			currentStep: step,
		});
		return;
	}

	if (step > state.currentStep) {
		trackEvent({
			category: config.category,
			action: MATOMO_FUNNEL_ACTION.STEP_COMPLETE,
			name: config.stepKeys[state.currentStep],
			value: elapsedSeconds(state.stepEnteredAt, now),
			dimensions,
		});
		writeState(config.storageKey, {
			...state,
			currentStep: step,
			stepEnteredAt: now,
		});
		return;
	}

	if (step < state.currentStep) {
		writeState(config.storageKey, {
			...state,
			currentStep: step,
			stepEnteredAt: now,
		});
	}
}

function emitAbandon(
	config: FunnelConfig,
	dimensions?: Record<number, string>,
): void {
	const state = readState(config.storageKey);
	if (!state) return;
	trackEvent({
		category: config.category,
		action: MATOMO_FUNNEL_ACTION.FUNNEL_ABANDON,
		name: config.stepKeys[state.currentStep],
		value: elapsedSeconds(state.startedAt, Date.now()),
		dimensions,
	});
}

export function useFunnelTracking(
	config: FunnelConfig,
	{ step, dimensions }: FunnelTrackingContext,
): void {
	useEffect(() => {
		handleStepEnter(config, step, dimensions);
	}, [config, step, dimensions]);

	useEffect(() => {
		function handleBeforeUnload(): void {
			emitAbandon(config, dimensions);
		}
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [config, dimensions]);
}

export function trackFunnelComplete(
	config: FunnelConfig,
	dimensions?: Record<number, string>,
): void {
	const state = readState(config.storageKey);
	if (!state) return;
	trackEvent({
		category: config.category,
		action: MATOMO_FUNNEL_ACTION.FUNNEL_COMPLETE,
		value: elapsedSeconds(state.startedAt, Date.now()),
		dimensions,
	});
	clearState(config.storageKey);
}
