import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeHero } from "../HomeHero";

function renderHero() {
	return render(<HomeHero />);
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

	it("uses a semantic section element", () => {
		const { container } = renderHero();
		expect(container.querySelector("section")).toBeInTheDocument();
	});
});
