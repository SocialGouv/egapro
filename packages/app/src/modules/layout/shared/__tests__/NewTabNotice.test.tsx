import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NewTabNotice } from "../NewTabNotice";

describe("NewTabNotice", () => {
	it("rend le texte d'annonce pour les lecteurs d'écran", () => {
		render(<NewTabNotice />);
		expect(screen.getByText(/ouvre une nouvelle fenêtre/i)).toBeInTheDocument();
	});

	it("est visuellement masqué via la classe fr-sr-only", () => {
		render(<NewTabNotice />);
		expect(screen.getByText(/ouvre une nouvelle fenêtre/i)).toHaveClass(
			"fr-sr-only",
		);
	});
});
