import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../HistoryListSection", () => ({
	HistoryListSection: () => <div data-testid="history-list-section" />,
}));

import { DeclarationHistoryPage } from "../DeclarationHistoryPage";

describe("DeclarationHistoryPage", () => {
	it("renders title and subtitle", () => {
		render(<DeclarationHistoryPage siren="130025265" year={2026} />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Historique des modifications",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText("Démarche des indicateurs de rémunération 2026"),
		).toBeInTheDocument();
	});

	it("renders breadcrumb with Mon espace link", () => {
		render(<DeclarationHistoryPage siren="130025265" year={2026} />);

		expect(screen.getByRole("link", { name: "Mon espace" })).toHaveAttribute(
			"href",
			"/mon-espace",
		);
	});

	it("renders the history list section", () => {
		render(<DeclarationHistoryPage siren="130025265" year={2026} />);

		expect(screen.getByTestId("history-list-section")).toBeInTheDocument();
	});
});
