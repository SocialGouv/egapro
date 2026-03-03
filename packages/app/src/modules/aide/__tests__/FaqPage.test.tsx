import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FaqPage } from "../FaqPage";

describe("FaqPage", () => {
	it("has #content id on main for skip links", () => {
		render(<FaqPage />);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("renders the page heading", () => {
		render(<FaqPage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /questions fréquentes/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the breadcrumb with correct links", () => {
		render(<FaqPage />);
		const breadcrumb = screen.getByRole("navigation", {
			name: /vous êtes ici/i,
		});
		expect(breadcrumb).toBeInTheDocument();

		const accueilLink = within(breadcrumb).getByRole("link", {
			name: /accueil/i,
		});
		expect(accueilLink).toHaveAttribute("href", "/");

		const aideLink = within(breadcrumb).getByRole("link", {
			name: /aide et ressources/i,
		});
		expect(aideLink).toHaveAttribute("href", "/aide");
	});

	it("renders the back link to aide page", () => {
		render(<FaqPage />);
		const backLink = screen.getByRole("link", { name: /retour/i });
		expect(backLink).toHaveAttribute("href", "/aide");
	});

	it("renders the summary navigation", () => {
		render(<FaqPage />);
		const summary = screen.getByRole("navigation", { name: /sommaire/i });
		expect(summary).toBeInTheDocument();
	});

	it("renders the remuneration section heading", () => {
		render(<FaqPage />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /indicateur de rémunération/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the representation section heading", () => {
		render(<FaqPage />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /indicateur de représentation/i,
			}),
		).toBeInTheDocument();
	});

	it("renders accordion groups", () => {
		render(<FaqPage />);
		const accordionButtons = screen.getAllByRole("button", {
			name: /intitulé accordéon/i,
		});
		expect(accordionButtons.length).toBe(16);
	});
});
