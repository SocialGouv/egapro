import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeclarationLockAlert } from "../DeclarationLockAlert";

describe("DeclarationLockAlert", () => {
	it("renders a DSFR warning alert with the lock title", () => {
		render(
			<DeclarationLockAlert
				holder={{
					firstName: "Camille",
					lastName: "Martin",
					email: "camille.martin@example.fr",
				}}
			/>,
		);

		const alert = screen.getByRole("alert");
		expect(alert).toHaveClass("fr-alert", "fr-alert--warning");
		expect(
			screen.getByText("Déclaration en cours de modification"),
		).toBeInTheDocument();
	});

	it("shows the full name and email when both are present", () => {
		render(
			<DeclarationLockAlert
				holder={{
					firstName: "Camille",
					lastName: "Martin",
					email: "camille.martin@example.fr",
				}}
			/>,
		);

		expect(
			screen.getByText(
				/Camille Martin \(camille\.martin@example\.fr\) modifie actuellement/,
			),
		).toBeInTheDocument();
	});

	it("shows the name without parentheses when the email is null", () => {
		render(
			<DeclarationLockAlert
				holder={{ firstName: "Camille", lastName: "Martin", email: null }}
			/>,
		);

		expect(
			screen.getByText(/^Camille Martin modifie actuellement/),
		).toBeInTheDocument();
		expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
	});

	it("falls back to the email alone when no name is provided", () => {
		render(
			<DeclarationLockAlert
				holder={{
					firstName: null,
					lastName: null,
					email: "owner@example.fr",
				}}
			/>,
		);

		const paragraph = screen.getByText(/modifie actuellement/).closest("p");
		expect(paragraph).toHaveTextContent(
			"owner@example.fr modifie actuellement",
		);
		expect(paragraph).not.toHaveTextContent("(owner@example.fr)");
	});

	it("falls back to a generic label when neither name nor email is available", () => {
		render(
			<DeclarationLockAlert
				holder={{ firstName: null, lastName: null, email: null }}
			/>,
		);

		expect(
			screen.getByText(/^Un autre utilisateur modifie actuellement/),
		).toBeInTheDocument();
	});

	it("uses the available name part when only one of first/last is set", () => {
		render(
			<DeclarationLockAlert
				holder={{
					firstName: "Alice",
					lastName: null,
					email: "alice@example.fr",
				}}
			/>,
		);

		expect(screen.getByText(/Alice \(alice@example\.fr\)/)).toBeInTheDocument();
	});
});
