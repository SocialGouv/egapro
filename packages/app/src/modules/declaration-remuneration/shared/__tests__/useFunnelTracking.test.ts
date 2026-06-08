import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }));

vi.mock("~/modules/analytics", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/analytics")>();
	return { ...actual, trackEvent: trackEventMock };
});

import {
	MATOMO_CUSTOM_DIMENSION,
	MATOMO_DECLARATION_ACTION,
	MATOMO_EVENT_CATEGORY,
} from "~/modules/analytics";

import { trackFunnelComplete, useFunnelTracking } from "../useFunnelTracking";

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
	it("emits funnel_start once on entering step 1, with the campaign-year dimension", () => {
		renderHook((props) => useFunnelTracking(props), {
			initialProps: { step: 1, year: 2024, sizeRange: undefined },
		});

		expect(trackEventMock).toHaveBeenCalledTimes(1);
		expect(lastEvent()).toEqual({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_DECLARATION_ACTION.FUNNEL_START,
			dimensions: { [MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR]: "2024" },
		});
	});

	it("does not re-emit funnel_start on a fresh mount at step 1 (anti-double via sessionStorage)", () => {
		renderHook((props) => useFunnelTracking(props), {
			initialProps: { step: 1, year: 2024, sizeRange: undefined },
		});
		trackEventMock.mockReset();

		renderHook((props) => useFunnelTracking(props), {
			initialProps: { step: 1, year: 2024, sizeRange: undefined },
		});

		expect(trackEventMock).not.toHaveBeenCalled();
	});

	it("emits step_complete with the step key, duration in seconds and both dimensions on a forward transition", () => {
		const { rerender } = renderHook((props) => useFunnelTracking(props), {
			initialProps: {
				step: 1,
				year: 2024,
				sizeRange: undefined as string | undefined,
			},
		});
		trackEventMock.mockReset();

		nowSpy.mockReturnValue(6_000);
		rerender({ step: 2, year: 2024, sizeRange: "50-99" });

		expect(lastEvent()).toEqual({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_DECLARATION_ACTION.STEP_COMPLETE,
			name: "step_1",
			value: 5,
			dimensions: {
				[MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR]: "2024",
				[MATOMO_CUSTOM_DIMENSION.WORKFORCE_RANGE]: "50-99",
			},
		});
	});

	it("emits funnel_abandon with the current step key and total duration on beforeunload", () => {
		renderHook((props) => useFunnelTracking(props), {
			initialProps: { step: 1, year: 2024, sizeRange: undefined },
		});
		trackEventMock.mockReset();

		nowSpy.mockReturnValue(9_000);
		window.dispatchEvent(new Event("beforeunload"));

		expect(lastEvent()).toEqual({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_DECLARATION_ACTION.FUNNEL_ABANDON,
			name: "step_1",
			value: 8,
			dimensions: { [MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR]: "2024" },
		});
	});

	it("does not emit any PII (only category, action, name, value, anonymised dimensions)", () => {
		const { rerender } = renderHook((props) => useFunnelTracking(props), {
			initialProps: {
				step: 1,
				year: 2024,
				sizeRange: "50-99" as string | undefined,
			},
		});
		nowSpy.mockReturnValue(3_000);
		rerender({ step: 2, year: 2024, sizeRange: "50-99" });

		for (const call of trackEventMock.mock.calls) {
			const event = call[0];
			expect(Object.keys(event).sort()).not.toContain("siren");
			const serialised = JSON.stringify(event);
			expect(serialised).not.toMatch(/\d{9}/);
			expect(serialised).not.toMatch(/@/);
		}
	});
});

describe("trackFunnelComplete", () => {
	it("emits funnel_complete with the total duration and clears the funnel state", () => {
		renderHook((props) => useFunnelTracking(props), {
			initialProps: { step: 1, year: 2024, sizeRange: undefined },
		});
		trackEventMock.mockReset();

		nowSpy.mockReturnValue(11_000);
		trackFunnelComplete({ sizeRange: "50-99" });

		expect(lastEvent()).toEqual({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_DECLARATION_ACTION.FUNNEL_COMPLETE,
			value: 10,
			dimensions: {
				[MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR]: "2024",
				[MATOMO_CUSTOM_DIMENSION.WORKFORCE_RANGE]: "50-99",
			},
		});

		trackEventMock.mockReset();
		window.dispatchEvent(new Event("beforeunload"));
		expect(trackEventMock).not.toHaveBeenCalled();
	});

	it("is a no-op when no funnel is in progress", () => {
		trackFunnelComplete({ sizeRange: undefined });
		expect(trackEventMock).not.toHaveBeenCalled();
	});
});
