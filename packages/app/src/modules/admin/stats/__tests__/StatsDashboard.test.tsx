import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const progressionUseQueryMock = vi.fn();
const stepDurationsUseQueryMock = vi.fn();
const stepDropoffUseQueryMock = vi.fn();
const funnelUseQueryMock = vi.fn();
const matomoFunnelUseQueryMock = vi.fn();
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
			getMatomoFunnel: {
				useQuery: (...args: unknown[]) => matomoFunnelUseQueryMock(...args),
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
vi.mock("../MatomoFunnelChart", () => ({
	MatomoFunnelChart: () => <div data-testid="matomo-funnel-chart" />,
}));
vi.mock("../MatomoFunnelTable", () => ({
	MatomoFunnelTable: () => <div data-testid="matomo-funnel-table" />,
}));
vi.mock("../CampaignRateTile", () => ({
	CampaignRateTile: () => <div data-testid="campaign-rate-tile" />,
}));

import { StatsDashboard } from "../StatsDashboard";
import {
	emptyFunnelData,
	setDefaultMocks,
} from "./helpers/statsDashboardMocks";

const defaultMocks = () =>
	setDefaultMocks({
		progressionUseQueryMock,
		statsUseQueryMock,
		stepDurationsUseQueryMock,
		stepDropoffUseQueryMock,
		funnelUseQueryMock,
		matomoFunnelUseQueryMock,
	});

describe("StatsDashboard — structure and filters", () => {
	beforeEach(() => {
		progressionUseQueryMock.mockReset();
		stepDurationsUseQueryMock.mockReset();
		stepDropoffUseQueryMock.mockReset();
		funnelUseQueryMock.mockReset();
		matomoFunnelUseQueryMock.mockReset();
		statsUseQueryMock.mockReset();
		defaultMocks();
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
});

describe("StatsDashboard — funnel section", () => {
	beforeEach(() => {
		progressionUseQueryMock.mockReset();
		stepDurationsUseQueryMock.mockReset();
		stepDropoffUseQueryMock.mockReset();
		funnelUseQueryMock.mockReset();
		statsUseQueryMock.mockReset();
		defaultMocks();
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

	it("shows the main and compliance funnel headings when data is available", () => {
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

	it("shows empty messages for revision and CSE funnels when no data", () => {
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

describe("StatsDashboard — Matomo behavioural funnel (K20/K21)", () => {
	beforeEach(() => {
		progressionUseQueryMock.mockReset();
		stepDurationsUseQueryMock.mockReset();
		stepDropoffUseQueryMock.mockReset();
		funnelUseQueryMock.mockReset();
		matomoFunnelUseQueryMock.mockReset();
		statsUseQueryMock.mockReset();
		defaultMocks();
	});

	it("renders the Matomo funnel section with chart and table when data is available (S8)", () => {
		matomoFunnelUseQueryMock.mockReturnValue({
			data: {
				startedCount: 120,
				completedCount: 80,
				abandonedCount: 40,
				steps: [
					{
						stepKey: "step_1",
						label: "Effectifs",
						completedCount: 110,
						avgDurationSeconds: 12,
					},
				],
			},
			isLoading: false,
			isError: false,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByRole("heading", { name: /comportement réel \(Matomo\)/i }),
		).toBeInTheDocument();
		expect(screen.getByTestId("matomo-funnel-chart")).toBeInTheDocument();
		expect(screen.getByTestId("matomo-funnel-table")).toBeInTheDocument();
	});

	it("shows a Matomo error alert without breaking the DB widgets (S13)", () => {
		matomoFunnelUseQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		expect(
			screen.getByText(/statistiques Matomo sont indisponibles/i),
		).toBeInTheDocument();
		expect(screen.getAllByTestId("funnel-chart").length).toBeGreaterThan(0);
		expect(screen.queryByTestId("matomo-funnel-chart")).not.toBeInTheDocument();
	});

	it("synchronises the Matomo query with the active year filter (S11)", () => {
		render(
			<StatsDashboard availableYears={[2026, 2025, 2024]} currentYear={2026} />,
		);
		const input = matomoFunnelUseQueryMock.mock.calls[0]?.[0] as {
			year: number;
		};
		expect(input.year).toBe(2026);
	});
});
