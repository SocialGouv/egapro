import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }));

vi.mock("../trackEvent", () => ({ trackEvent: trackEventMock }));

import {
	buildFunnelStepKeys,
	type FunnelConfig,
	MATOMO_CUSTOM_DIMENSION,
	MATOMO_EVENT_CATEGORY,
	MATOMO_FUNNEL_ACTION,
} from "../shared/events";
import { trackFunnelComplete, useFunnelTracking } from "../useFunnelTracking";

// A 6-step test funnel, mirroring the declaration funnel shape (steps 0..6,
// tracked 1..6) without coupling the test to any specific business funnel.
const TEST_FUNNEL: FunnelConfig = {
	category: MATOMO_EVENT_CATEGORY.DECLARATION,
	stepKeys: buildFunnelStepKeys(6),
	storageKey: "egapro:test-funnel",
};

const yearDimension = { [MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR]: "2024" };
const yearAndSize = {
	[MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR]: "2024",
	[MATOMO_CUSTOM_DIMENSION.WORKFORCE_RANGE]: "50-99",
};

const nowSpy = vi.spyOn(Date, "now");

beforeEach(() => {
	sessionStorage.clear();
	trackEventMock.mockReset();
	nowSpy.mockReturnValue(1_000);
});

afterEach(() => {
	vi.clearAllMocks();
});

function lastEvent() {
	return trackEventMock.mock.calls.at(-1)?.[0];
}

describe("useFunnelTracking", () => {
	it("emits funnel_start once on entering the first step, with the campaign-year dimension", () => {
		renderHook((props) => useFunnelTracking(TEST_FUNNEL, props), {
			initialProps: { step: 1, dimensions: yearDimension },
		});

		expect(trackEventMock).toHaveBeenCalledTimes(1);
		expect(lastEvent()).toEqual({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_FUNNEL_ACTION.FUNNEL_START,
			dimensions: yearDimension,
		});
	});

	it("does not re-emit funnel_start on a fresh mount at the first step (anti-double via sessionStorage)", () => {
		renderHook((props) => useFunnelTracking(TEST_FUNNEL, props), {
			initialProps: { step: 1, dimensions: yearDimension },
		});
		trackEventMock.mockReset();

		renderHook((props) => useFunnelTracking(TEST_FUNNEL, props), {
			initialProps: { step: 1, dimensions: yearDimension },
		});

		expect(trackEventMock).not.toHaveBeenCalled();
	});

	it("emits step_complete with the step key, duration in seconds and both dimensions on a forward transition", () => {
		const { rerender } = renderHook(
			(props) => useFunnelTracking(TEST_FUNNEL, props),
			{
				initialProps: {
					step: 1,
					dimensions: yearDimension as Record<number, string>,
				},
			},
		);
		trackEventMock.mockReset();

		nowSpy.mockReturnValue(6_000);
		rerender({ step: 2, dimensions: yearAndSize });

		expect(lastEvent()).toEqual({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_FUNNEL_ACTION.STEP_COMPLETE,
			name: "step_1",
			value: 5,
			dimensions: yearAndSize,
		});
	});

	it("emits funnel_abandon with the current step key and total duration on beforeunload", () => {
		renderHook((props) => useFunnelTracking(TEST_FUNNEL, props), {
			initialProps: { step: 1, dimensions: yearDimension },
		});
		trackEventMock.mockReset();

		nowSpy.mockReturnValue(9_000);
		window.dispatchEvent(new Event("beforeunload"));

		expect(lastEvent()).toEqual({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_FUNNEL_ACTION.FUNNEL_ABANDON,
			name: "step_1",
			value: 8,
			dimensions: yearDimension,
		});
	});

	it("does not emit any PII (only category, action, name, value, anonymised dimensions)", () => {
		const { rerender } = renderHook(
			(props) => useFunnelTracking(TEST_FUNNEL, props),
			{
				initialProps: {
					step: 1,
					dimensions: yearAndSize as Record<number, string>,
				},
			},
		);
		nowSpy.mockReturnValue(3_000);
		rerender({ step: 2, dimensions: yearAndSize });

		for (const call of trackEventMock.mock.calls) {
			const event = call[0];
			expect(Object.keys(event).sort()).not.toContain("siren");
			const serialised = JSON.stringify(event);
			expect(serialised).not.toMatch(/\d{9}/);
			expect(serialised).not.toMatch(/@/);
		}
	});

	it("keeps two funnels independent via distinct storage keys", () => {
		const otherFunnel: FunnelConfig = {
			category: MATOMO_EVENT_CATEGORY.CSE_OPINION,
			stepKeys: buildFunnelStepKeys(2),
			storageKey: "egapro:other-funnel",
		};

		renderHook(() =>
			useFunnelTracking(TEST_FUNNEL, { step: 1, dimensions: yearDimension }),
		);
		renderHook(() =>
			useFunnelTracking(otherFunnel, { step: 1, dimensions: yearDimension }),
		);

		const categories = trackEventMock.mock.calls.map(
			(call) => call[0].category,
		);
		expect(categories).toContain(MATOMO_EVENT_CATEGORY.DECLARATION);
		expect(categories).toContain(MATOMO_EVENT_CATEGORY.CSE_OPINION);
	});
});

describe("trackFunnelComplete", () => {
	it("emits funnel_complete with the total duration and clears the funnel state", () => {
		renderHook((props) => useFunnelTracking(TEST_FUNNEL, props), {
			initialProps: { step: 1, dimensions: yearDimension },
		});
		trackEventMock.mockReset();

		nowSpy.mockReturnValue(11_000);
		trackFunnelComplete(TEST_FUNNEL, yearAndSize);

		expect(lastEvent()).toEqual({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_FUNNEL_ACTION.FUNNEL_COMPLETE,
			value: 10,
			dimensions: yearAndSize,
		});

		trackEventMock.mockReset();
		window.dispatchEvent(new Event("beforeunload"));
		expect(trackEventMock).not.toHaveBeenCalled();
	});

	it("is a no-op when no funnel is in progress", () => {
		trackFunnelComplete(TEST_FUNNEL, undefined);
		expect(trackEventMock).not.toHaveBeenCalled();
	});
});
