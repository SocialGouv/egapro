import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { getCurrentYear } from "~/modules/domain";

const { getOverviewMock, getLockTimeoutMock } = vi.hoisted(() => ({
	getOverviewMock: vi.fn(),
	getLockTimeoutMock: vi.fn(),
}));

vi.mock("~/trpc/server", () => ({
	api: {
		adminSettings: {
			getOverview: getOverviewMock,
			getLockTimeout: getLockTimeoutMock,
		},
	},
	HydrateClient: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../AdminSettingsSections", () => ({
	AdminSettingsSections: (props: {
		initialYear: number;
		configuredYears: number[];
		lockTimeoutMinutes: number;
	}) =>
		React.createElement("div", {
			"data-testid": "admin-settings-sections",
			"data-initial-year": props.initialYear,
			"data-years": props.configuredYears.join(","),
			"data-lock-timeout": props.lockTimeoutMinutes,
		}),
}));

import { AdminSettingsPage } from "../AdminSettingsPage";

describe("AdminSettingsPage", () => {
	it("renders the page title above the settings sections", async () => {
		getOverviewMock.mockResolvedValue({ configuredYears: [2026] });
		getLockTimeoutMock.mockResolvedValue({ timeoutMinutes: 30 });
		render(await AdminSettingsPage());
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /paramètres de la plateforme/i,
			}),
		).toBeInTheDocument();
		expect(screen.getByTestId("admin-settings-sections")).toBeInTheDocument();
	});

	it("opens on the current campaign year, not on the latest configured one", async () => {
		getOverviewMock.mockResolvedValue({
			configuredYears: [2025, 2026, getCurrentYear() + 5],
		});
		getLockTimeoutMock.mockResolvedValue({ timeoutMinutes: 30 });
		render(await AdminSettingsPage());
		const sections = screen.getByTestId("admin-settings-sections");
		expect(sections.getAttribute("data-initial-year")).toBe(
			String(getCurrentYear()),
		);
		expect(sections.getAttribute("data-years")).toBe(
			`2025,2026,${getCurrentYear() + 5}`,
		);
	});

	it("seeds the sections with the stored lock timeout", async () => {
		getOverviewMock.mockResolvedValue({ configuredYears: [] });
		getLockTimeoutMock.mockResolvedValue({ timeoutMinutes: 45 });
		render(await AdminSettingsPage());
		expect(
			screen
				.getByTestId("admin-settings-sections")
				.getAttribute("data-lock-timeout"),
		).toBe("45");
	});
});
