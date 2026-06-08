import { useEffect } from "react";

import {
	MATOMO_CUSTOM_DIMENSION,
	MATOMO_DECLARATION_ACTION,
	MATOMO_EVENT_CATEGORY,
	MATOMO_FUNNEL_STEP_KEYS,
	trackEvent,
} from "~/modules/analytics";

const STORAGE_KEY = "egapro:declaration-funnel";
const FIRST_FUNNEL_STEP = 1;
const LAST_FUNNEL_STEP = MATOMO_FUNNEL_STEP_KEYS.length - 1;

type FunnelState = {
	startedAt: number;
	stepEnteredAt: number;
	currentStep: number;
	year: number;
};

type FunnelContext = {
	step: number;
	year: number;
	sizeRange?: string;
};

function readState(): FunnelState | null {
	if (typeof window === "undefined") return null;
	const raw = sessionStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as FunnelState;
	} catch {
		return null;
	}
}

function writeState(state: FunnelState): void {
	if (typeof window === "undefined") return;
	sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState(): void {
	if (typeof window === "undefined") return;
	sessionStorage.removeItem(STORAGE_KEY);
}

function buildDimensions(
	year: number,
	sizeRange?: string,
): Record<number, string> {
	const dimensions: Record<number, string> = {
		[MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR]: String(year),
	};
	if (sizeRange) {
		dimensions[MATOMO_CUSTOM_DIMENSION.WORKFORCE_RANGE] = sizeRange;
	}
	return dimensions;
}

function elapsedSeconds(from: number, to: number): number {
	return Math.round((to - from) / 1000);
}

function handleStepEnter({ step, year, sizeRange }: FunnelContext): void {
	if (step < FIRST_FUNNEL_STEP || step > LAST_FUNNEL_STEP) return;

	const now = Date.now();
	const state = readState();

	if (!state) {
		if (step === FIRST_FUNNEL_STEP) {
			trackEvent({
				category: MATOMO_EVENT_CATEGORY.DECLARATION,
				action: MATOMO_DECLARATION_ACTION.FUNNEL_START,
				dimensions: buildDimensions(year, sizeRange),
			});
		}
		writeState({ startedAt: now, stepEnteredAt: now, currentStep: step, year });
		return;
	}

	if (step > state.currentStep) {
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_DECLARATION_ACTION.STEP_COMPLETE,
			name: MATOMO_FUNNEL_STEP_KEYS[state.currentStep],
			value: elapsedSeconds(state.stepEnteredAt, now),
			dimensions: buildDimensions(year, sizeRange),
		});
		writeState({ ...state, currentStep: step, stepEnteredAt: now });
		return;
	}

	if (step < state.currentStep) {
		writeState({ ...state, currentStep: step, stepEnteredAt: now });
	}
}

function emitAbandon(sizeRange?: string): void {
	const state = readState();
	if (!state) return;
	trackEvent({
		category: MATOMO_EVENT_CATEGORY.DECLARATION,
		action: MATOMO_DECLARATION_ACTION.FUNNEL_ABANDON,
		name: MATOMO_FUNNEL_STEP_KEYS[state.currentStep],
		value: elapsedSeconds(state.startedAt, Date.now()),
		dimensions: buildDimensions(state.year, sizeRange),
	});
}

export function useFunnelTracking({
	step,
	year,
	sizeRange,
}: FunnelContext): void {
	useEffect(() => {
		handleStepEnter({ step, year, sizeRange });
	}, [step, year, sizeRange]);

	useEffect(() => {
		function handleBeforeUnload(): void {
			emitAbandon(sizeRange);
		}
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [sizeRange]);
}

export function trackFunnelComplete({
	sizeRange,
}: {
	sizeRange?: string;
}): void {
	const state = readState();
	if (!state) return;
	trackEvent({
		category: MATOMO_EVENT_CATEGORY.DECLARATION,
		action: MATOMO_DECLARATION_ACTION.FUNNEL_COMPLETE,
		value: elapsedSeconds(state.startedAt, Date.now()),
		dimensions: buildDimensions(state.year, sizeRange),
	});
	clearState();
}
