import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const progressionUseQueryMock = vi.fn();
const statsUseQueryMock = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		adminStats: {
			getCampaignProgression: {
				useQuery: (...args: unknown[]) => progressionUseQueryMock(...args),
			},
			getCampaignStats: {
				useQuery: (...args: unknown[]) => statsUseQueryMock(...args),
			},
		},
	},
}));

vi.mock("../CampaignProgressionChart", () => ({
	CampaignProgressionChart: () => <div data-testid="progression-chart" />,
}));

vi.mock("../CampaignProgressionTable", () => ({
	CampaignProgressionTable: () => <div data-testid="progression-table" />,
}));

import { CampaignStatsPage } from "../CampaignStatsPage";

describe("CampaignStatsPage — K1 integration", () => {
	beforeEach(() => {
		progressionUseQueryMock.mockReset();
		statsUseQueryMock.mockReset();
		progressionUseQueryMock.mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
		});
		statsUseQueryMock.mockReturnValue({
			data: {
				totalObligated: 100,
				totalSubmitted: 50,
				submissionRate: 50,
				previousYearRate: 45,
			},
			isLoading: false,
			isError: false,
		});
	});

	it("renders the K1 section with its own heading", () => {
		render(
			<CampaignStatsPage
				availableYears={[2026, 2025, 2024, 2023]}
				currentYear={2026}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: /^taux de déclaration$/i, level: 2 }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: /taux de déclaration 2026/i }),
		).toBeInTheDocument();
	});

	it("renders a K1 year select with 4 options (currentYear + 3 previous)", () => {
		render(
			<CampaignStatsPage
				availableYears={[2026, 2025, 2024, 2023, 2022, 2021]}
				currentYear={2026}
			/>,
		);

		const select = screen.getByLabelText(
			/année \(taux de déclaration\)/i,
		) as HTMLSelectElement;
		expect(select).toBeInTheDocument();
		expect(select.options).toHaveLength(4);
		expect(Array.from(select.options).map((o) => o.value)).toEqual([
			"2026",
			"2025",
			"2024",
			"2023",
		]);
		expect(select.value).toBe("2026");
	});

	it("changing the K1 year re-queries getCampaignStats with the new year", async () => {
		const user = userEvent.setup();
		render(
			<CampaignStatsPage
				availableYears={[2026, 2025, 2024, 2023]}
				currentYear={2026}
			/>,
		);

		statsUseQueryMock.mockClear();
		await user.selectOptions(
			screen.getByLabelText(/année \(taux de déclaration\)/i),
			"2024",
		);

		const lastCall = statsUseQueryMock.mock.calls.at(-1)?.[0] as
			| { year: number; sizeRange?: string }
			| undefined;
		expect(lastCall?.year).toBe(2024);
	});

	it("the size range filter is shared between K1 and K2 (single state)", async () => {
		const user = userEvent.setup();
		render(
			<CampaignStatsPage
				availableYears={[2026, 2025, 2024]}
				currentYear={2026}
			/>,
		);

		progressionUseQueryMock.mockClear();
		statsUseQueryMock.mockClear();
		await user.selectOptions(
			screen.getByLabelText(/tranche d'effectif/i),
			"100-149",
		);

		const lastK1 = statsUseQueryMock.mock.calls.at(-1)?.[0] as
			| { sizeRange?: string }
			| undefined;
		const lastK2 = progressionUseQueryMock.mock.calls.at(-1)?.[0] as
			| { sizeRange?: string }
			| undefined;
		expect(lastK1?.sizeRange).toBe("100-149");
		expect(lastK2?.sizeRange).toBe("100-149");
	});

	it("renders the K2 progression section unchanged", () => {
		progressionUseQueryMock.mockReturnValue({
			data: [{ year: 2026, points: [{ day: "2026-01-01", cumulative: 5 }] }],
			isLoading: false,
			isError: false,
		});
		render(
			<CampaignStatsPage
				availableYears={[2026, 2025, 2024]}
				currentYear={2026}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: /progression dans le temps/i }),
		).toBeInTheDocument();
		expect(screen.getByTestId("progression-chart")).toBeInTheDocument();
	});

	it("shows the K2 empty-state message when no years are selected", async () => {
		const user = userEvent.setup();
		render(
			<CampaignStatsPage
				availableYears={[2026, 2025, 2024]}
				currentYear={2026}
			/>,
		);

		const checkboxes = screen.getAllByRole("checkbox");
		for (const cb of checkboxes) {
			if ((cb as HTMLInputElement).checked) {
				await user.click(cb);
			}
		}
		expect(
			screen.getByText(/sélectionnez au moins une année/i),
		).toBeInTheDocument();
	});

	it("shows the K2 loading message when the progression query is in flight", () => {
		progressionUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
		});
		render(
			<CampaignStatsPage
				availableYears={[2026, 2025, 2024]}
				currentYear={2026}
			/>,
		);
		expect(screen.getByText(/chargement du graphique/i)).toBeInTheDocument();
	});

	it("shows the K2 error alert when the progression query fails", () => {
		progressionUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});
		render(
			<CampaignStatsPage
				availableYears={[2026, 2025, 2024]}
				currentYear={2026}
			/>,
		);
		expect(
			screen.getByText(/erreur est survenue lors du chargement/i),
		).toBeInTheDocument();
	});

	it("passes placeholderData (prev) through to keep the previous result while a new query is running", () => {
		render(
			<CampaignStatsPage
				availableYears={[2026, 2025, 2024]}
				currentYear={2026}
			/>,
		);
		const options = progressionUseQueryMock.mock.calls[0]?.[1] as
			| { placeholderData: (prev: unknown) => unknown }
			| undefined;
		expect(options?.placeholderData("previous")).toBe("previous");
	});
});
