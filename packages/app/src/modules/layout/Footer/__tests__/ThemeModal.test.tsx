import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeModal } from "../ThemeModal";

describe("ThemeModal", () => {
	it("uses a secondary heading while keeping the dialog labelled", () => {
		render(<ThemeModal />);

		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Paramètres d'affichage",
			}),
		).toHaveAttribute("id", "fr-theme-modal-title");
		expect(screen.getByRole("dialog")).toHaveAccessibleName(
			"Paramètres d'affichage",
		);
	});
});
