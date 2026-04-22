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
	it("renders the deadlines section and passes configured years to the form", async () => {
		getOverviewMock.mockResolvedValue({
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
			screen.getByRole("heading", { level: 2, name: /échéances de campagne/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: /année de campagne active/i }),
		).not.toBeInTheDocument();
		const deadlines = screen.getByTestId("campaign-deadlines-form");
		expect(deadlines.getAttribute("data-initial-year")).toBe("2027");
		expect(deadlines.getAttribute("data-years")).toBe("2025,2026,2027");
	});

	it("falls back to the current calendar year when no year is configured", async () => {
		getOverviewMock.mockResolvedValue({
			configuredYears: [],
		});
		render(await AdminSettingsPage());
		const deadlines = screen.getByTestId("campaign-deadlines-form");
		expect(deadlines.getAttribute("data-initial-year")).toBe(
			String(new Date().getFullYear()),
		);
	});
});
