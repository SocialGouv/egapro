import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeclarationLayout } from "../DeclarationLayout";

const COMPANY = {
	name: "Société Démo",
	siren: "123456789",
	gipWorkforce: 1200,
	hasCse: true,
};

describe("DeclarationLayout", () => {
	it("wraps the funnel content in the shared company chrome", () => {
		render(
			<DeclarationLayout campaignYear={2026} company={COMPANY}>
				<p>Contenu de l'étape</p>
			</DeclarationLayout>,
		);

		expect(screen.getByText("123 456 789")).toBeInTheDocument();
		expect(screen.getByText("Contenu de l'étape")).toBeInTheDocument();
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("names the funnel as the current breadcrumb page", () => {
		render(
			<DeclarationLayout campaignYear={2026} company={COMPANY}>
				<p>Contenu de l'étape</p>
			</DeclarationLayout>,
		);

		expect(
			screen.getByText("Démarche des indicateurs de représentation 2026"),
		).toHaveAttribute("aria-current", "page");
	});
});
