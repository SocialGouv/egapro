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
import { setDefaultMocks } from "./helpers/statsDashboardMocks";

const defaultMocks = () =>
	setDefaultMocks({
		progressionUseQueryMock,
		statsUseQueryMock,
		stepDurationsUseQueryMock,
		stepDropoffUseQueryMock,
		funnelUseQueryMock,
	});

describe("StatsDashboard — campaign section states", () => {
	beforeEach(() => {
		progressionUseQueryMock.mockReset();
		stepDurationsUseQueryMock.mockReset();
		stepDropoffUseQueryMock.mockReset();
		funnelUseQueryMock.mockReset();
		statsUseQueryMock.mockReset();
		defaultMocks();
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
			screen.getByText(
				/erreur est survenue lors du chargement des statistiques/i,
			),
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
			screen.getByText(
				/erreur est survenue lors du chargement des délais par étape/i,
			),
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
			screen.getByText(
				/erreur est survenue lors du chargement des taux d'abandon/i,
			),
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
});

describe("StatsDashboard — query options", () => {
	beforeEach(() => {
		progressionUseQueryMock.mockReset();
		stepDurationsUseQueryMock.mockReset();
		stepDropoffUseQueryMock.mockReset();
		funnelUseQueryMock.mockReset();
		statsUseQueryMock.mockReset();
		defaultMocks();
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
});
