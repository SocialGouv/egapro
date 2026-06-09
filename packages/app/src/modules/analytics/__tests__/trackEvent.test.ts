import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv, pushMock, sendEventMock } = vi.hoisted(() => ({
	mockEnv: {
		NEXT_PUBLIC_MATOMO_URL: "https://matomo.test" as string | undefined,
		NEXT_PUBLIC_MATOMO_SITE_ID: "1" as string | undefined,
	},
	pushMock: vi.fn(),
	sendEventMock: vi.fn(),
}));

vi.mock("~/env", () => ({ env: mockEnv }));
vi.mock("@socialgouv/matomo-next", () => ({
	push: pushMock,
	sendEvent: sendEventMock,
}));

import {
	buildFunnelStepKeys,
	MATOMO_CUSTOM_DIMENSION,
	MATOMO_EVENT_CATEGORY,
	MATOMO_FUNNEL_ACTION,
} from "../shared/events";
import { trackEvent } from "../trackEvent";

beforeEach(() => {
	mockEnv.NEXT_PUBLIC_MATOMO_URL = "https://matomo.test";
	mockEnv.NEXT_PUBLIC_MATOMO_SITE_ID = "1";
	pushMock.mockClear();
	sendEventMock.mockClear();
});

describe("trackEvent", () => {
	it("emits a typed event via sendEvent when Matomo is configured", () => {
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_FUNNEL_ACTION.STEP_COMPLETE,
			name: "step_2",
			value: 42,
		});

		expect(sendEventMock).toHaveBeenCalledWith({
			category: "declaration",
			action: "step_complete",
			name: "step_2",
			value: 42,
		});
	});

	it("omits name and value when they are not provided", () => {
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_FUNNEL_ACTION.FUNNEL_START,
		});

		expect(sendEventMock).toHaveBeenCalledWith({
			category: "declaration",
			action: "funnel_start",
		});
	});

	it("sets each custom dimension before emitting the event", () => {
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_FUNNEL_ACTION.FUNNEL_START,
			dimensions: {
				[MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR]: "2025",
				[MATOMO_CUSTOM_DIMENSION.WORKFORCE_RANGE]: "50-99",
			},
		});

		expect(pushMock).toHaveBeenCalledWith([
			"setCustomDimension",
			MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR,
			"2025",
		]);
		expect(pushMock).toHaveBeenCalledWith([
			"setCustomDimension",
			MATOMO_CUSTOM_DIMENSION.WORKFORCE_RANGE,
			"50-99",
		]);

		const firstDimensionOrder = pushMock.mock.invocationCallOrder[0];
		const eventOrder = sendEventMock.mock.invocationCallOrder[0];
		expect(firstDimensionOrder).toBeLessThan(eventOrder ?? Infinity);
	});

	it("is a silent no-op when Matomo is not configured", () => {
		mockEnv.NEXT_PUBLIC_MATOMO_URL = undefined;

		trackEvent({
			category: MATOMO_EVENT_CATEGORY.DECLARATION,
			action: MATOMO_FUNNEL_ACTION.FUNNEL_START,
		});

		expect(sendEventMock).not.toHaveBeenCalled();
		expect(pushMock).not.toHaveBeenCalled();
	});
});

describe("buildFunnelStepKeys", () => {
	it("derives one stable, untranslated key per step, indexed by step number", () => {
		expect(buildFunnelStepKeys(6)).toEqual([
			"step_0",
			"step_1",
			"step_2",
			"step_3",
			"step_4",
			"step_5",
			"step_6",
		]);
	});

	it("returns a single key for a zero-step funnel", () => {
		expect(buildFunnelStepKeys(0)).toEqual(["step_0"]);
	});
});
