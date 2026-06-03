import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		NEXT_PUBLIC_MATOMO_URL: "https://matomo.test" as string | undefined,
		NEXT_PUBLIC_MATOMO_SITE_ID: "42" as string | undefined,
		MATOMO_API_TOKEN: "super-secret-token" as string | undefined,
	},
}));

vi.mock("~/env", () => ({ env: mockEnv }));

import { fetchMatomoEventsReport } from "../matomo";

const fetchSpy = vi.fn();

beforeEach(() => {
	mockEnv.NEXT_PUBLIC_MATOMO_URL = "https://matomo.test";
	mockEnv.NEXT_PUBLIC_MATOMO_SITE_ID = "42";
	mockEnv.MATOMO_API_TOKEN = "super-secret-token";
	fetchSpy.mockReset();
	vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("fetchMatomoEventsReport", () => {
	it("builds the Reporting API request and returns the parsed rows", async () => {
		const rows = [
			{ label: "funnel_start", nb_events: 120 },
			{ label: "funnel_complete", nb_events: 80 },
		];
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => rows,
		});

		const result = await fetchMatomoEventsReport({
			method: "Events.getAction",
			period: "range",
			date: "2025-01-01,2025-12-31",
		});

		expect(result).toEqual(rows);

		const calledUrl = fetchSpy.mock.calls[0]?.[0] as URL;
		expect(calledUrl.pathname).toBe("/index.php");
		expect(calledUrl.searchParams.get("module")).toBe("API");
		expect(calledUrl.searchParams.get("format")).toBe("json");
		expect(calledUrl.searchParams.get("idSite")).toBe("42");
		expect(calledUrl.searchParams.get("method")).toBe("Events.getAction");
		expect(calledUrl.searchParams.get("period")).toBe("range");
		expect(calledUrl.searchParams.get("date")).toBe("2025-01-01,2025-12-31");
	});

	it("never puts the token in the URL (sent in the request body)", async () => {
		fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => [] });

		await fetchMatomoEventsReport({
			method: "Events.getAction",
			period: "range",
			date: "2025-01-01,2025-12-31",
		});

		const calledUrl = fetchSpy.mock.calls[0]?.[0] as URL;
		expect(calledUrl.href).not.toContain("super-secret-token");
		expect(calledUrl.searchParams.get("token_auth")).toBeNull();
	});

	it("forwards the optional segment param when provided", async () => {
		fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => [] });

		await fetchMatomoEventsReport({
			method: "Events.getAction",
			period: "range",
			date: "2025-01-01,2025-12-31",
			segment: "dimension1==2025",
		});

		const calledUrl = fetchSpy.mock.calls[0]?.[0] as URL;
		expect(calledUrl.searchParams.get("segment")).toBe("dimension1==2025");
	});

	it("throws a clear error when Matomo is not configured", async () => {
		mockEnv.MATOMO_API_TOKEN = undefined;

		await expect(
			fetchMatomoEventsReport({
				method: "Events.getAction",
				period: "range",
				date: "2025-01-01,2025-12-31",
			}),
		).rejects.toThrow(/non configuré/i);

		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("throws without leaking the token when the response is not ok", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
			json: async () => ({}),
		});

		let caught: unknown;
		try {
			await fetchMatomoEventsReport({
				method: "Events.getAction",
				period: "range",
				date: "2025-01-01,2025-12-31",
			});
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(Error);
		expect((caught as Error).message).not.toContain("super-secret-token");
	});

	it("throws when Matomo returns an API error payload", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ result: "error", message: "Invalid date range" }),
		});

		await expect(
			fetchMatomoEventsReport({
				method: "Events.getAction",
				period: "range",
				date: "bad,range",
			}),
		).rejects.toThrow();
	});
});
