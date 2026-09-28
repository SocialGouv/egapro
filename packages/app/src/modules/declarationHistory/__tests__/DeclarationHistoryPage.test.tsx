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

	it("does not render a breadcrumb", () => {
		render(<DeclarationHistoryPage siren="130025265" year={2026} />);

		expect(
			screen.queryByRole("navigation", { name: "vous êtes ici :" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Mon espace" }),
		).not.toBeInTheDocument();
	});

	it("renders the history list section", () => {
		render(<DeclarationHistoryPage siren="130025265" year={2026} />);

		expect(screen.getByTestId("history-list-section")).toBeInTheDocument();
	});
});
