import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfirmationPage } from "../ConfirmationPage";

describe("ConfirmationPage", () => {
	const year = new Date().getFullYear() + 1;

	it("renders the page title", () => {
		render(<ConfirmationPage />);

		expect(
			screen.getByText(`Démarche des indicateurs de rémunération ${year}`),
		).toBeInTheDocument();
	});

	it("renders the success message", () => {
		render(<ConfirmationPage />);

		expect(
			screen.getByText(`Votre parcours ${year} est désormais terminé`),
		).toBeInTheDocument();
	});

	it("renders the default email in receipt card", () => {
		render(<ConfirmationPage />);

		expect(screen.getByText("adresse@exemple.fr")).toBeInTheDocument();
	});

	it("renders the provided email in receipt card", () => {
		render(<ConfirmationPage email="test@example.com" />);

		expect(screen.getByText("test@example.com")).toBeInTheDocument();
	});

	it("renders the resend button", () => {
		render(<ConfirmationPage />);

		expect(
			screen.getByRole("button", {
				name: /Renvoyer l'accusé de réception/,
			}),
		).toBeInTheDocument();
	});

	it("renders document download section", () => {
		render(<ConfirmationPage />);

		expect(
			screen.getByText("Documents récapitulatifs de votre déclaration"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/récapitulatif de la déclaration des indicateurs/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/récapitulatif de la seconde déclaration/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/récapitulatif des éléments transmis/),
		).toBeInTheDocument();
	});

	it("renders the feedback banner", () => {
		render(<ConfirmationPage />);

		expect(
			screen.getByText("Comment s'est passée votre démarche ?"),
		).toBeInTheDocument();
	});

	it("renders navigation links", () => {
		render(<ConfirmationPage />);

		const modifyLink = screen.getByRole("link", {
			name: /Modifier mes dépôts/,
		});
		expect(modifyLink).toHaveAttribute("href", "/avis-cse/etape/2");

		const spaceLink = screen.getByRole("link", { name: "Mon espace" });
		expect(spaceLink).toHaveAttribute("href", "/mon-espace");
	});
});
