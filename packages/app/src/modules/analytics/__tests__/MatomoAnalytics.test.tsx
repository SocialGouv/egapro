import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv, trackAppRouterMock, pushMock } = vi.hoisted(() => ({
	mockEnv: {
		NEXT_PUBLIC_MATOMO_URL: "https://matomo.test" as string | undefined,
		NEXT_PUBLIC_MATOMO_SITE_ID: "1" as string | undefined,
	},
	trackAppRouterMock: vi.fn(),
	pushMock: vi.fn(),
}));

vi.mock("~/env", () => ({ env: mockEnv }));
vi.mock("@socialgouv/matomo-next", () => ({
	trackAppRouter: trackAppRouterMock,
	push: pushMock,
}));
vi.mock("next/navigation", () => ({
	usePathname: () => "/declaration-remuneration/etape/1",
	// A query string that could carry PII (here a SIREN) — cleanUrl must drop it.
	useSearchParams: () => new URLSearchParams("siren=123456789"),
}));

import { MatomoAnalytics } from "../MatomoAnalytics";

beforeEach(() => {
	mockEnv.NEXT_PUBLIC_MATOMO_URL = "https://matomo.test";
	mockEnv.NEXT_PUBLIC_MATOMO_SITE_ID = "1";
	trackAppRouterMock.mockClear();
	pushMock.mockClear();
});

describe("MatomoAnalytics", () => {
	it("tracks with cleanUrl so query strings (possible PII) never reach Matomo", () => {
		render(<MatomoAnalytics />);

		expect(trackAppRouterMock).toHaveBeenCalledTimes(1);
		const settings = trackAppRouterMock.mock.calls[0]?.[0];
		expect(settings.cleanUrl).toBe(true);
		expect(settings.url).toBe("https://matomo.test");
		expect(settings.siteId).toBe("1");
	});

	it("honours Do Not Track and disables heatmaps/session recording on init", () => {
		render(<MatomoAnalytics />);

		const settings = trackAppRouterMock.mock.calls[0]?.[0];
		// onInitialization runs once, before the first page view is sent.
		settings.onInitialization();

		expect(pushMock).toHaveBeenCalledWith(["setDoNotTrack", true]);
		expect(pushMock).toHaveBeenCalledWith(["HeatmapSessionRecording::disable"]);
	});

	it("does not track when Matomo is not configured", async () => {
		mockEnv.NEXT_PUBLIC_MATOMO_URL = undefined;
		vi.resetModules();
		const { MatomoAnalytics: Fresh } = await import("../MatomoAnalytics");

		const { container } = render(<Fresh />);

		expect(container).toBeEmptyDOMElement();
		expect(trackAppRouterMock).not.toHaveBeenCalled();
	});
});
