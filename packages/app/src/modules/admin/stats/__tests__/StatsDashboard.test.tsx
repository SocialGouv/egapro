import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const progressionUseQueryMock = vi.fn();
const stepDurationsUseQueryMock = vi.fn();
const stepDropoffUseQueryMock = vi.fn();
const funnelUseQueryMock = vi.fn();
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
			getStepDurations: {
				useQuery: (...args: unknown[]) => stepDurationsUseQueryMock(...args),
			},
			getStepDropoffRate: {
				useQuery: (...args: unknown[]) => stepDropoffUseQueryMock(...args),
			},
			getCompletionFunnel: {
				useQuery: (...args: unknown[]) => funnelUseQueryMock(...args),
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
vi.mock("../StepDurationsChart", () => ({
	StepDurationsChart: () => <div data-testid="step-durations-chart" />,
}));
vi.mock("../StepDurationsTable", () => ({
	StepDurationsTable: () => <div data-testid="step-durations-table" />,
}));
vi.mock("../StepDropoffChart", () => ({
	StepDropoffChart: () => <div data-testid="step-dropoff-chart" />,
}));
vi.mock("../StepDropoffTable", () => ({
	StepDropoffTable: () => <div data-testid="step-dropoff-table" />,
}));
vi.mock("../CompletionFunnelChart", () => ({
	CompletionFunnelChart: () => <div data-testid="funnel-chart" />,
}));
vi.mock("../CompletionFunnelTable", () => ({
	CompletionFunnelTable: () => <div data-testid="funnel-table" />,
}));
vi.mock("../CampaignRateTile", () => ({
	CampaignRateTile: () => <div data-testid="campaign-rate-tile" />,
}));

import { StatsDashboard } from "../StatsDashboard";

const emptyFunnelData = {
	mainFunnel: [],
	complianceFunnel: [],
	revisionFunnel: [],
	cseFunnel: [],
};

describe("StatsDashboard", () => {
	beforeEach(() => {
		progressionUseQueryMock.mockReset();
		stepDurationsUseQueryMock.mockReset();
		stepDropoffUseQueryMock.mockReset();
		funnelUseQueryMock.mockReset();
		statsUseQueryMock.mockReset();

		progressionUseQueryMock.mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
		});
		statsUseQueryMock.mockReturnValue({
			data: { totalObligated: 0, totalSubmitted: 0, submissionRate: 0 },
			isLoading: false,
			isError: false,
		});
		stepDurationsUseQueryMock.mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
		});
		stepDropoffUseQueryMock.mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
		});
		funnelUseQueryMock.mockReturnValue({
			data: emptyFunnelData,
			isLoading: false,
			isError: false,
		});
	});

	it("renders the h1 Statistiques heading", () => {
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByRole("heading", { name: /^Statistiques$/i, level: 1 }),
		).toBeInTheDocument();
	});

	it("renders the campaign section h2 heading", () => {
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByRole("heading", { name: /Suivi de campagne/i, level: 2 }),
		).toBeInTheDocument();
	});

	it("renders the funnel section h2 heading", () => {
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByRole("heading", { name: /Funnels de complétion/i, level: 2 }),
		).toBeInTheDocument();
	});

	it("renders the global filters: YearsFilter, CompanySizeFilter, StagnationDaysFilter", () => {
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(screen.getByLabelText(/tranche d'effectif/i)).toBeInTheDocument();
		expect(
			screen.getByLabelText(/considérer une déclaration abandonnée après/i),
		).toBeInTheDocument();
	});

	it("renders the CampaignRateTile", () => {
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(screen.getByTestId("campaign-rate-tile")).toBeInTheDocument();
	});

	it("renders campaign progression chart and table when data is available", () => {
		progressionUseQueryMock.mockReturnValue({
			data: [{ year: 2026, points: [{ day: "2026-01-01", cumulative: 5 }] }],
			isLoading: false,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(screen.getByTestId("progression-chart")).toBeInTheDocument();
		expect(screen.getByTestId("progression-table")).toBeInTheDocument();
	});

	it("shows the funnel sections when funnel data is available", () => {
		funnelUseQueryMock.mockReturnValue({
			data: {
				mainFunnel: [{ step: "draft", count: 100 }],
				complianceFunnel: [{ step: "draft", count: 50 }],
				revisionFunnel: [],
				cseFunnel: [],
			},
			isLoading: false,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByRole("heading", { name: /Funnel principal/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: /Funnel parcours conformité/i }),
		).toBeInTheDocument();
	});

	it("shows empty message for revision funnel when no data", () => {
		funnelUseQueryMock.mockReturnValue({
			data: emptyFunnelData,
			isLoading: false,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByText(/Aucune révision pour ces filtres/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Aucune déclaration avec CSE pour ces filtres/i),
		).toBeInTheDocument();
	});

	it("shows funnel loading state", () => {
		funnelUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(screen.getByText(/Chargement des funnels/i)).toBeInTheDocument();
	});

	it("shows funnel error state", () => {
		funnelUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByText(/erreur est survenue lors du chargement des funnels/i),
		).toBeInTheDocument();
	});

	it("shows campaign progression loading state", () => {
		progressionUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getAllByText(/chargement du graphique/i).length,
		).toBeGreaterThan(0);
	});

	it("shows campaign progression error state", () => {
		progressionUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByText(/erreur est survenue lors du chargement des statistiques/i),
		).toBeInTheDocument();
	});

	it("shows step durations loading state", () => {
		stepDurationsUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getAllByText(/chargement du graphique/i).length,
		).toBeGreaterThan(0);
	});

	it("shows step durations error state", () => {
		stepDurationsUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByText(/erreur est survenue lors du chargement des délais par étape/i),
		).toBeInTheDocument();
	});

	it("renders step durations chart and table when data is available", () => {
		stepDurationsUseQueryMock.mockReturnValue({
			data: [{ step: "intro", median: 2, p90: 5 }],
			isLoading: false,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(screen.getByTestId("step-durations-chart")).toBeInTheDocument();
		expect(screen.getByTestId("step-durations-table")).toBeInTheDocument();
	});

	it("shows step dropoff loading state", () => {
		stepDropoffUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getAllByText(/chargement du graphique/i).length,
		).toBeGreaterThan(0);
	});

	it("shows step dropoff error state", () => {
		stepDropoffUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByText(/erreur est survenue lors du chargement des taux d'abandon/i),
		).toBeInTheDocument();
	});

	it("renders step dropoff chart and table when data is available", () => {
		stepDropoffUseQueryMock.mockReturnValue({
			data: [{ step: "intro", dropoffRate: 0.05 }],
			isLoading: false,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(screen.getByTestId("step-dropoff-chart")).toBeInTheDocument();
		expect(screen.getByTestId("step-dropoff-table")).toBeInTheDocument();
	});

	it("renders revision and CSE funnel charts when data is available", () => {
		funnelUseQueryMock.mockReturnValue({
			data: {
				mainFunnel: [{ step: "draft", count: 100 }],
				complianceFunnel: [{ step: "draft", count: 50 }],
				revisionFunnel: [{ step: "draft", count: 10 }],
				cseFunnel: [{ step: "draft", count: 5 }],
			},
			isLoading: false,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByRole("heading", { name: /Funnel cycle de révision/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: /Funnel cycle CSE/i }),
		).toBeInTheDocument();
		expect(screen.getAllByTestId("funnel-chart")).toHaveLength(4);
	});

	it("shows campaign progression empty-state when no years are selected", () => {
		progressionUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: false,
			enabled: false,
		});
		render(<StatsDashboard availableYears={[]} currentYear={2026} />);
		expect(
			screen.getByText(/sélectionnez au moins une année/i),
		).toBeInTheDocument();
	});

	it("passes placeholderData (prev) through for progression query", () => {
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		const options = progressionUseQueryMock.mock.calls[0]?.[1] as
			| { placeholderData: (prev: unknown) => unknown }
			| undefined;
		expect(options?.placeholderData("prev-value")).toBe("prev-value");
	});

	it("passes placeholderData (prev) through for step durations query", () => {
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		const options = stepDurationsUseQueryMock.mock.calls[0]?.[1] as
			| { placeholderData: (prev: unknown) => unknown }
			| undefined;
		expect(options?.placeholderData("prev-value")).toBe("prev-value");
	});

	it("passes placeholderData (prev) through for step dropoff query", () => {
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		const options = stepDropoffUseQueryMock.mock.calls[0]?.[1] as
			| { placeholderData: (prev: unknown) => unknown }
			| undefined;
		expect(options?.placeholderData("prev-value")).toBe("prev-value");
	});

	it("passes placeholderData (prev) through for funnel query", () => {
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		const options = funnelUseQueryMock.mock.calls[0]?.[1] as
			| { placeholderData: (prev: unknown) => unknown }
			| undefined;
		expect(options?.placeholderData("prev-value")).toBe("prev-value");
	});
});
