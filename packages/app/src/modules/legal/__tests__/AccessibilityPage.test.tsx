import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccessibilityPage } from "../AccessibilityPage";

describe("AccessibilityPage — content not subject to the obligation", () => {
	it("declares the hosting provider's PDF as third-party content", () => {
		render(<AccessibilityPage />);

		const statement = screen.getByRole("heading", {
			level: 3,
			name: "Contenus non soumis à l'obligation d'accessibilité",
		}).nextElementSibling;

		expect(statement).toHaveTextContent(
			"L'accord de protection des données de l'hébergeur OVH, document PDF non accessible",
		);
		expect(statement).toHaveTextContent("est un contenu tiers");
		expect(screen.queryByText("Aucun contenu n'est exclu.")).toBeNull();
	});

	it("links to the page that carries the HTML summary", () => {
		render(<AccessibilityPage />);

		expect(
			screen.getByRole("link", { name: "Données personnelles" }),
		).toHaveAttribute("href", "/donnees-personnelles#garanties-hebergeur");
	});
});
