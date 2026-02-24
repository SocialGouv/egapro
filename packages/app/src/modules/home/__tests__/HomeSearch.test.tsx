import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeSearch } from "../HomeSearch";

describe("HomeSearch", () => {
	it("renders the section heading", () => {
		render(<HomeSearch />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /rechercher une entreprise et consulter ses résultats/i,
			}),
		).toBeInTheDocument();
	});

	it("mentions the remuneration indicators", () => {
		render(<HomeSearch />);
		expect(
			screen.getByText(/indicateurs de rémunération/i),
		).toBeInTheDocument();
	});

	it("mentions the representation indicators", () => {
		render(<HomeSearch />);
		expect(
			screen.getByText(/indicateurs de représentation/i),
		).toBeInTheDocument();
	});

	it("renders the SIREN/name search input", () => {
		render(<HomeSearch />);
		expect(
			screen.getByLabelText(/numéro siren ou le nom de l'entreprise/i),
		).toBeInTheDocument();
	});

	it("renders the region select", () => {
		render(<HomeSearch />);
		expect(screen.getByLabelText(/région/i)).toBeInTheDocument();
	});

	it("renders the department select", () => {
		render(<HomeSearch />);
		expect(screen.getByLabelText(/département/i)).toBeInTheDocument();
	});

	it("renders the sector select", () => {
		render(<HomeSearch />);
		expect(screen.getByLabelText(/secteur d'activité/i)).toBeInTheDocument();
	});

	it("renders the search button", () => {
		render(<HomeSearch />);
		expect(
			screen.getByRole("button", { name: /rechercher/i }),
		).toBeInTheDocument();
	});

	it("submits the form to the index search results page", () => {
		const { container } = render(<HomeSearch />);
		const form = container.querySelector("form");
		expect(form).toHaveAttribute("action", "/index-egapro/recherche");
		expect(form).toHaveAttribute("method", "GET");
	});

	it("has the correct name attribute on the search input", () => {
		render(<HomeSearch />);
		const input = screen.getByLabelText(/numéro siren/i);
		expect(input).toHaveAttribute("name", "query");
	});
});
