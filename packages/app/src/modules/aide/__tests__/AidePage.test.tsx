import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/db/getCampaignDeadlines", async () => {
	const { getDefaultCampaignDeadlines } = await import("~/modules/domain");
	return {
		getCampaignDeadlines: vi
			.fn()
			.mockResolvedValue(getDefaultCampaignDeadlines(2026)),
	};
});

vi.mock("~/server/db/getGlobalSettings", () => ({
	getActiveCampaignYear: vi.fn().mockResolvedValue(2026),
}));

import { AidePage } from "../AidePage";

describe("AidePage", () => {
	it("has #content id on main for skip links", async () => {
		render(await AidePage());
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("renders the page heading", async () => {
		render(await AidePage());
		expect(
			screen.getByRole("heading", { level: 1, name: /aide et ressources/i }),
		).toBeInTheDocument();
	});

	it("renders the breadcrumb navigation", async () => {
		render(await AidePage());
		const breadcrumbNav = screen.getByRole("navigation", {
			name: /vous êtes ici/i,
		});
		expect(breadcrumbNav).toBeInTheDocument();
		const breadcrumbLink = breadcrumbNav.querySelector('a[href="/"]');
		expect(breadcrumbLink).toBeInTheDocument();
	});

	it("renders the deadline callout for the active campaign year", async () => {
		render(await AidePage());
		const callout = screen
			.getByRole("heading", {
				level: 2,
				name: /date limite de déclaration/i,
			})
			.closest(".fr-callout");
		expect(callout).not.toBeNull();
		expect(callout).toHaveTextContent(/2026/);
	});

	it("renders the three resource cards", async () => {
		render(await AidePage());
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /nouveau site : ce qui change/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /indicateurs de rémunération/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /indicateurs de représentation/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the textes de référence section", async () => {
		render(await AidePage());
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /textes de référence/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getAllByText(/textes législatifs et réglementaires/i).length,
		).toBeGreaterThanOrEqual(1);
	});

	it("renders external links to Legifrance with target blank", async () => {
		render(await AidePage());
		const articleLink = screen.getByRole("link", {
			name: /article l\. 1142-8/i,
		});
		expect(articleLink).toHaveAttribute(
			"href",
			"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037396684",
		);
		expect(articleLink).toHaveAttribute("target", "_blank");

		const decretLink = screen.getByRole("link", {
			name: /décret n° 2019-15/i,
		});
		expect(decretLink).toHaveAttribute(
			"href",
			"https://www.legifrance.gouv.fr/loda/id/JORFTEXT000038234561",
		);
		expect(decretLink).toHaveAttribute("target", "_blank");
	});

	it("renders the back link", async () => {
		render(await AidePage());
		const backLink = screen.getByRole("link", { name: /retour à l'accueil/i });
		expect(backLink).toHaveAttribute("href", "/");
	});
});
