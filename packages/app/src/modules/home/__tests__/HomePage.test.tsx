import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePage } from "../HomePage";

// HomeNotice is a client component using useState — mock it to avoid issues in jsdom
vi.mock("../HomeNotice", () => ({
	HomeNotice: () => (
		<div data-testid="home-notice">Bandeau d&apos;information</div>
	),
}));

const REMUNERATION_DEADLINE = new Date(2026, 5, 1);
const REPRESENTATION_DEADLINE = new Date(2026, 2, 1);

function renderPage() {
	return render(
		<HomePage
			remunerationDeadline={REMUNERATION_DEADLINE}
			representationDeadline={REPRESENTATION_DEADLINE}
		/>,
	);
}

describe("HomePage", () => {
	it("has #content id on main for skip links", () => {
		renderPage();
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("renders the notice banner", () => {
		renderPage();
		expect(screen.getByTestId("home-notice")).toBeInTheDocument();
	});

	it("renders the hero section heading", () => {
		renderPage();
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /bienvenue sur egapro/i,
			}),
		).toBeInTheDocument();
	});

	it("passes the campaign deadlines down to the hero", () => {
		renderPage();
		expect(
			screen.getByText("Rémunération : 1ᵉʳ juin 2026"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Représentation équilibrée : 1ᵉʳ mars 2026"),
		).toBeInTheDocument();
	});

	it("renders the search section", () => {
		renderPage();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /rechercher une entreprise/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the three placeholder sections", () => {
		renderPage();
		const placeholders = screen.getAllByText("Section non finalisée");
		expect(placeholders).toHaveLength(3);
	});
});
