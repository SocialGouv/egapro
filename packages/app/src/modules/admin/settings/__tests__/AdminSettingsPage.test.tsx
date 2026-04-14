import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const { getOverviewMock } = vi.hoisted(() => ({
	getOverviewMock: vi.fn(),
}));

vi.mock("~/trpc/server", () => ({
	api: {
		adminSettings: { getOverview: getOverviewMock },
	},
	HydrateClient: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../ActiveYearForm", () => ({
	ActiveYearForm: (props: {
		initialActiveYear: number | null;
		fallbackYear: number;
	}) =>
		React.createElement("div", {
			"data-testid": "active-year-form",
			"data-initial": props.initialActiveYear ?? "",
			"data-fallback": props.fallbackYear,
		}),
}));

vi.mock("../CampaignDeadlinesForm", () => ({
	CampaignDeadlinesForm: (props: {
		initialYear: number;
		configuredYears: number[];
	}) =>
		React.createElement("div", {
			"data-testid": "campaign-deadlines-form",
			"data-initial-year": props.initialYear,
			"data-years": props.configuredYears.join(","),
		}),
}));

import { AdminSettingsPage } from "../AdminSettingsPage";

describe("AdminSettingsPage", () => {
	it("renders both sections and passes overview data to the forms", async () => {
		getOverviewMock.mockResolvedValue({
			activeCampaignYear: 2027,
			configuredYears: [2025, 2026, 2027],
		});
		render(await AdminSettingsPage());
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /paramètres de la plateforme/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: /année de référence/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: /échéances de campagne/i }),
		).toBeInTheDocument();
		const active = screen.getByTestId("active-year-form");
		expect(active.getAttribute("data-initial")).toBe("2027");
		const deadlines = screen.getByTestId("campaign-deadlines-form");
		expect(deadlines.getAttribute("data-initial-year")).toBe("2027");
		expect(deadlines.getAttribute("data-years")).toBe("2025,2026,2027");
	});

	it("falls back to the current calendar year when none is configured", async () => {
		getOverviewMock.mockResolvedValue({
			activeCampaignYear: null,
			configuredYears: [],
		});
		render(await AdminSettingsPage());
		const active = screen.getByTestId("active-year-form");
		expect(active.getAttribute("data-initial")).toBe("");
		const fallback = Number(active.getAttribute("data-fallback"));
		expect(fallback).toBe(new Date().getFullYear());
	});
});
