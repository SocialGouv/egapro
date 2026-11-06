import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { civilDate } from "~/modules/domain";
import { HomePage } from "../HomePage";

// HomeNotice is a client component using useState — mock it to avoid issues in jsdom
vi.mock("../HomeNotice", () => ({
	HomeNotice: () => (
		<div data-testid="home-notice">Bandeau d&apos;information</div>
	),
}));

const REMUNERATION_DEADLINE = civilDate(2026, 5, 1);
const REPRESENTATION_DEADLINE = civilDate(2026, 2, 1);

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

	it("renders the sections in the design order", () => {
		renderPage();
		expect(
			screen
				.getAllByRole("heading", { level: 2 })
				.map((heading) => heading.textContent),
		).toEqual([
			"Pourquoi déclarer ?",
			"Que devez-vous déclarer ?",
			"Consulter les résultats d'une entreprise",
		]);
	});

	it("passes the campaign deadlines down to the why-declare cards", () => {
		renderPage();
		expect(screen.getByText("Échéance au 1ᵉʳ juin")).toBeInTheDocument();
		expect(screen.getByText("Échéance au 1ᵉʳ mars")).toBeInTheDocument();
	});

	it("no longer renders any unfinished section placeholder", () => {
		renderPage();
		expect(screen.queryByText("Section non finalisée")).not.toBeInTheDocument();
	});
});
