import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeSearch } from "../HomeSearch";

describe("HomeSearch", () => {
	it("affiche le titre de la section", () => {
		render(<HomeSearch />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /rechercher une entreprise et consulter ses résultats/i,
			}),
		).toBeInTheDocument();
	});

	it("mentionne les indicateurs de rémunération", () => {
		render(<HomeSearch />);
		expect(
			screen.getByText(/indicateurs de rémunération/i),
		).toBeInTheDocument();
	});

	it("mentionne les indicateurs de représentation", () => {
		render(<HomeSearch />);
		expect(
			screen.getByText(/indicateurs de représentation/i),
		).toBeInTheDocument();
	});

	it("affiche le champ de saisie SIREN/nom", () => {
		render(<HomeSearch />);
		expect(
			screen.getByLabelText(/numéro siren ou le nom de l'entreprise/i),
		).toBeInTheDocument();
	});

	it("affiche le select de région", () => {
		render(<HomeSearch />);
		expect(screen.getByLabelText(/région/i)).toBeInTheDocument();
	});

	it("affiche le select de département", () => {
		render(<HomeSearch />);
		expect(screen.getByLabelText(/département/i)).toBeInTheDocument();
	});

	it("affiche le select de secteur d'activité", () => {
		render(<HomeSearch />);
		expect(screen.getByLabelText(/secteur d'activité/i)).toBeInTheDocument();
	});

	it("affiche le bouton de recherche", () => {
		render(<HomeSearch />);
		expect(
			screen.getByRole("button", { name: /rechercher/i }),
		).toBeInTheDocument();
	});

	it("le formulaire cible la page de résultats de l'index", () => {
		const { container } = render(<HomeSearch />);
		const form = container.querySelector("form");
		expect(form).toHaveAttribute("action", "/index-egapro/recherche");
		expect(form).toHaveAttribute("method", "GET");
	});

	it("le champ de saisie a le bon attribut name pour les params URL", () => {
		render(<HomeSearch />);
		const input = screen.getByLabelText(/numéro siren/i);
		expect(input).toHaveAttribute("name", "query");
	});
});
