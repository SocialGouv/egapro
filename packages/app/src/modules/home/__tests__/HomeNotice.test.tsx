import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HomeNotice } from "../HomeNotice";

describe("HomeNotice", () => {
	it("affiche le titre du bandeau", () => {
		render(<HomeNotice />);
		expect(screen.getByText(/egapro évolue/i)).toBeInTheDocument();
	});

	it("affiche le texte descriptif", () => {
		render(<HomeNotice />);
		expect(
			screen.getByText(/nouvelles directives européennes/i),
		).toBeInTheDocument();
	});

	it("affiche le lien 'En savoir plus'", () => {
		render(<HomeNotice />);
		const link = screen.getByRole("link", { name: /en savoir plus/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/actualites");
	});

	it("affiche le bouton de fermeture", () => {
		render(<HomeNotice />);
		expect(
			screen.getByRole("button", { name: /masquer le message/i }),
		).toBeInTheDocument();
	});

	it("masque le bandeau quand on clique sur le bouton de fermeture", async () => {
		const user = userEvent.setup();
		render(<HomeNotice />);

		await user.click(
			screen.getByRole("button", { name: /masquer le message/i }),
		);

		expect(screen.queryByText(/egapro évolue/i)).not.toBeInTheDocument();
	});

	it("a la classe fr-notice--info", () => {
		const { container } = render(<HomeNotice />);
		expect(container.querySelector(".fr-notice--info")).toBeInTheDocument();
	});
});
