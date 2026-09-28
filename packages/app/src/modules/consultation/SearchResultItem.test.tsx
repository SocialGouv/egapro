import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { declarationFixture } from "./__fixtures__/declaration";
import { SearchResultItem } from "./SearchResultItem";

describe("SearchResultItem", () => {
	it("names the company and links to its page", () => {
		render(
			<SearchResultItem
				declaration={declarationFixture({ name: "Alpha" })}
				searchQuery=""
			/>,
		);

		expect(screen.getByRole("link", { name: "Alpha" })).toHaveAttribute(
			"href",
			"/index-egapro/entreprise/998900001",
		);
	});

	it("carries the current search so the company page can return to it", () => {
		render(
			<SearchResultItem
				declaration={declarationFixture({ name: "Alpha" })}
				searchQuery="q=Alpha&region=11"
			/>,
		);

		expect(screen.getByRole("link", { name: "Alpha" })).toHaveAttribute(
			"href",
			"/index-egapro/entreprise/998900001?from=q%3DAlpha%26region%3D11",
		);
	});

	it("lists the four facts of the maquette card", () => {
		render(
			<SearchResultItem declaration={declarationFixture()} searchQuery="" />,
		);

		expect(screen.getByText(/SIREN/)).toBeInTheDocument();
		expect(screen.getByText("998900001")).toBeInTheDocument();
		// The card shows where the company is, not its street address.
		expect(screen.getByText("Paris, Île-de-France")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Conseil en systèmes et logiciels informatiques (62.02A)",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Plus de 1000")).toBeInTheDocument();
	});

	it("gives the workforce as a bracket, never as a headcount", () => {
		render(
			<SearchResultItem
				declaration={declarationFixture({ workforceEma: 62 })}
				searchQuery=""
			/>,
		);

		expect(screen.getByText("De 50 à 99")).toBeInTheDocument();
		expect(screen.queryByText("62")).not.toBeInTheDocument();
	});

	it("names the country instead of a département for a foreign company", () => {
		render(
			<SearchResultItem
				declaration={declarationFixture({
					countryCode: "BE",
					countryLabel: "Belgique",
					departmentLabel: null,
					region: null,
				})}
				searchQuery=""
			/>,
		);

		expect(screen.getByText(/Pays/)).toBeInTheDocument();
		expect(screen.getByText("Belgique")).toBeInTheDocument();
	});

	it("omits a fact whose value is unknown", () => {
		render(
			<SearchResultItem
				declaration={declarationFixture({ workforceEma: null })}
				searchQuery=""
			/>,
		);

		expect(screen.queryByText(/Effectif/)).not.toBeInTheDocument();
	});

	it("shows each masked company fact only once", () => {
		render(
			<SearchResultItem
				declaration={declarationFixture({
					name: "Non-diffusible",
					address: "Non-diffusible",
					countryCode: "Non-diffusible",
					countryLabel: "Non-diffusible",
					departmentLabel: "Non-diffusible",
					region: "Non-diffusible",
					nafCode: "Non-diffusible",
					nafLabel: "Non-diffusible",
				})}
				searchQuery=""
			/>,
		);

		expect(screen.queryByText(/Non-diffusible.*Non-diffusible/)).toBeNull();
		expect(screen.getAllByText("Non-diffusible")).toHaveLength(3);
	});
});
