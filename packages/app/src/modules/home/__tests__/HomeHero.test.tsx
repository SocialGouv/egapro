import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeHero } from "../HomeHero";

const REMUNERATION_DEADLINE = new Date(2026, 5, 1);
const REPRESENTATION_DEADLINE = new Date(2026, 2, 1);

function renderHero() {
	return render(
		<HomeHero
			remunerationDeadline={REMUNERATION_DEADLINE}
			representationDeadline={REPRESENTATION_DEADLINE}
		/>,
	);
}

describe("HomeHero", () => {
	it("renders the main heading", () => {
		renderHero();
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /bienvenue sur egapro/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the platform description", () => {
		renderHero();
		expect(
			screen.getByText(/indicateurs de rémunération et de représentation/i),
		).toBeInTheDocument();
	});

	// /mon-espace enforces the missing-information gate; /declaration-remuneration skips it via callbackUrl
	it("renders the declaration CTA link", () => {
		renderHero();
		const link = screen.getByRole("link", {
			name: /déclarer mes indicateurs/i,
		});
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/mon-espace");
	});

	it("renders the info about companies with 50+ employees", () => {
		renderHero();
		expect(
			screen.getByText(/entreprises de plus de 50 salariés/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/plus de 35 000 entreprises déclarantes/i),
		).toBeInTheDocument();
	});

	it("renders one deadline line per démarche, each with its own admin-configured date", () => {
		renderHero();
		expect(
			screen.getByText(/déclaration annuelle obligatoire/i),
		).toBeInTheDocument();
		expect(
			screen.getByText("Rémunération : 1ᵉʳ juin 2026"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Représentation équilibrée : 1ᵉʳ mars 2026"),
		).toBeInTheDocument();
	});

	it("reflects a change to either deadline independently", () => {
		render(
			<HomeHero
				remunerationDeadline={new Date(2027, 9, 15)}
				representationDeadline={REPRESENTATION_DEADLINE}
			/>,
		);

		expect(
			screen.getByText("Rémunération : 15 octobre 2027"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Représentation équilibrée : 1ᵉʳ mars 2026"),
		).toBeInTheDocument();
	});

	it("uses a semantic section element", () => {
		const { container } = renderHero();
		expect(container.querySelector("section")).toBeInTheDocument();
	});
});
