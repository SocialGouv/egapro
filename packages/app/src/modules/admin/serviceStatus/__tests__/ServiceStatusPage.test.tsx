import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const overviewUseQueryMock = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		adminStatus: {
			getOverview: {
				useQuery: (...args: unknown[]) => overviewUseQueryMock(...args),
			},
		},
	},
}));

import { ServiceStatusPage } from "../ServiceStatusPage";
import { summarizeServiceStatus } from "../shared/statusLabels";
import type { ServiceStatusOverview } from "../types";
import { NOW, scheduledJob, serviceProbe } from "./fixtures";

const probes = [serviceProbe()];
const jobs = [scheduledJob()];

function overview(
	overrides: Partial<ServiceStatusOverview> = {},
): ServiceStatusOverview {
	return {
		generatedAt: NOW,
		lastCheckedAt: NOW,
		staleAfterSeconds: 300,
		summary: summarizeServiceStatus(probes, jobs),
		probes,
		jobs,
		incidents: [],
		grafanaUrl: null,
		...overrides,
	};
}

function useQueryResult(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		data: overview(),
		error: null,
		isLoading: false,
		dataUpdatedAt: NOW.getTime(),
		...overrides,
	};
}

describe("ServiceStatusPage", () => {
	beforeEach(() => {
		overviewUseQueryMock.mockReset();
	});

	it("polls every 30 seconds", () => {
		overviewUseQueryMock.mockReturnValue(useQueryResult());

		render(<ServiceStatusPage />);

		expect(overviewUseQueryMock).toHaveBeenCalledWith(undefined, {
			refetchInterval: 30_000,
		});
	});

	it("announces the refresh politely without stealing focus", () => {
		overviewUseQueryMock.mockReturnValue(useQueryResult());

		render(<ServiceStatusPage />);

		const live = screen.getByText(/État actualisé à/);
		expect(live).toHaveAttribute("aria-live", "polite");
		expect(live).toHaveAttribute("aria-atomic", "true");
	});

	it("renders the summary, both tables and the incident section", () => {
		overviewUseQueryMock.mockReturnValue(useQueryResult());

		render(<ServiceStatusPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "État des services" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les services sont opérationnels."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("table", { name: /Sondes de service/ }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("table", { name: /Traitements planifiés/ }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Aucun incident enregistré sur les 30 derniers jours."),
		).toBeInTheDocument();
	});

	it("shows the Grafana link only when it is configured", () => {
		overviewUseQueryMock.mockReturnValue(useQueryResult());
		const { rerender } = render(<ServiceStatusPage />);

		expect(
			screen.queryByRole("link", { name: /Tableaux de bord Grafana/ }),
		).not.toBeInTheDocument();

		overviewUseQueryMock.mockReturnValue(
			useQueryResult({
				data: overview({ grafanaUrl: "https://grafana.example.com/d/egapro" }),
			}),
		);
		rerender(<ServiceStatusPage />);

		expect(
			screen.getByRole("link", { name: /Tableaux de bord Grafana/ }),
		).toHaveAttribute("href", "https://grafana.example.com/d/egapro");
	});

	it("shows a loading state while the first overview arrives", () => {
		overviewUseQueryMock.mockReturnValue(
			useQueryResult({ data: undefined, isLoading: true }),
		);

		render(<ServiceStatusPage />);

		expect(
			screen.getByText("Chargement de l'état des services…"),
		).toBeInTheDocument();
	});

	it("shows an error alert when the overview cannot be fetched", () => {
		overviewUseQueryMock.mockReturnValue(
			useQueryResult({ data: undefined, error: new Error("boom") }),
		);

		render(<ServiceStatusPage />);

		expect(screen.getByRole("alert")).toBeInTheDocument();
		expect(
			screen.getByText("L'état des services n'a pas pu être chargé."),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("table", { name: /Sondes de service/ }),
		).not.toBeInTheDocument();
	});

	it("keeps the last successful read on screen when a refresh fails", () => {
		overviewUseQueryMock.mockReturnValue(
			useQueryResult({ error: new Error("boom") }),
		);

		render(<ServiceStatusPage />);

		expect(screen.getByRole("alert")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Les valeurs affichées sont celles de la dernière relève réussie.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("table", { name: /Sondes de service/ }),
		).toBeInTheDocument();
	});
});
