import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }));

vi.mock("~/modules/analytics", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/analytics")>();
	return { ...actual, trackEvent: trackEventMock };
});

import { MATOMO_ACTION, MATOMO_EVENT_CATEGORY } from "~/modules/analytics";
import {
	startCategoryModelTimer,
	trackCategoryImportDuration,
} from "../categoryModelTracking";

const TIMER_KEY = "egapro:category-model-started-at";

const nowSpy = vi.spyOn(Date, "now");

beforeEach(() => {
	sessionStorage.clear();
	trackEventMock.mockReset();
	nowSpy.mockReturnValue(1_000);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("startCategoryModelTimer", () => {
	it("records the current time when no timer is running", () => {
		startCategoryModelTimer();

		expect(sessionStorage.getItem(TIMER_KEY)).toBe("1000");
	});

	it("does not overwrite an already-running timer (set-once)", () => {
		startCategoryModelTimer();

		nowSpy.mockReturnValue(9_000);
		startCategoryModelTimer();

		expect(sessionStorage.getItem(TIMER_KEY)).toBe("1000");
	});
});

describe("trackCategoryImportDuration", () => {
	it("emits the import-duration event with the elapsed seconds and clears the timer", () => {
		startCategoryModelTimer();

		nowSpy.mockReturnValue(6_000);
		trackCategoryImportDuration();

		expect(trackEventMock).toHaveBeenCalledTimes(1);
		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.DOCUMENT,
			action: MATOMO_ACTION.CATEGORY_IMPORT_DURATION,
			value: 5,
		});
		expect(sessionStorage.getItem(TIMER_KEY)).toBeNull();
	});

	it("emits a numeric value only — no PII fields", () => {
		startCategoryModelTimer();

		nowSpy.mockReturnValue(4_000);
		trackCategoryImportDuration();

		const event = trackEventMock.mock.calls[0]?.[0];
		expect(typeof event.value).toBe("number");
		expect(event.name).toBeUndefined();
	});

	it("is a no-op (no event) when no timer was started", () => {
		trackCategoryImportDuration();

		expect(trackEventMock).not.toHaveBeenCalled();
	});

	it("does not emit twice when called again after the timer was consumed", () => {
		startCategoryModelTimer();
		trackCategoryImportDuration();
		trackEventMock.mockReset();

		trackCategoryImportDuration();

		expect(trackEventMock).not.toHaveBeenCalled();
	});

	it("ignores a corrupted timer value and emits no event", () => {
		sessionStorage.setItem(TIMER_KEY, "not-a-number");

		trackCategoryImportDuration();

		expect(trackEventMock).not.toHaveBeenCalled();
		expect(sessionStorage.getItem(TIMER_KEY)).toBeNull();
	});
});
