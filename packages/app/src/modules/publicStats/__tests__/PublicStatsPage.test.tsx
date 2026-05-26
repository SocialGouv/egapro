import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/trpc/react", () => ({
	api: {
		publicStats: {
			getCurrentCampaignRate: {
				useQuery: () => ({ data: undefined, isLoading: true, isError: false }),
			},
		},
	},
}));

import { PublicStatsPage } from "../PublicStatsPage";

describe("PublicStatsPage", () => {
	it("renders the page heading", () => {
		render(<PublicStatsPage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Statistiques publiques",
			}),
		).toBeInTheDocument();
	});

	it("renders the lead paragraph describing the page content", () => {
		render(<PublicStatsPage />);
		expect(
			screen.getByText(/Indicateurs clés sur l'égalité professionnelle/i),
		).toBeInTheDocument();
	});

	it("embeds the current campaign rate tile", () => {
		render(<PublicStatsPage />);
		expect(screen.getByText(/chargement du taux/i)).toBeInTheDocument();
	});
});
