import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeclarationLockAlert } from "../DeclarationLockAlert";

describe("DeclarationLockAlert", () => {
	it("renders the full name followed by the email in parentheses", () => {
		render(
			<DeclarationLockAlert
				holder={{
					firstName: "Alice",
					lastName: "Martin",
					email: "alice@example.fr",
				}}
			/>,
		);

		expect(
			screen.getByText(/Alice Martin \(alice@example\.fr\)/),
		).toBeInTheDocument();
		expect(
			screen.getByText("Déclaration en cours de modification"),
		).toBeInTheDocument();
	});

	it("falls back to the email alone when the name is missing", () => {
		render(
			<DeclarationLockAlert
				holder={{ firstName: null, lastName: null, email: "owner@example.fr" }}
			/>,
		);

		const paragraph = screen.getByText(/modifie actuellement/).closest("p");
		expect(paragraph).toHaveTextContent(
			"owner@example.fr modifie actuellement",
		);
		expect(paragraph).not.toHaveTextContent("(owner@example.fr)");
	});

	it("falls back to a generic label when neither name nor email is known", () => {
		render(
			<DeclarationLockAlert
				holder={{ firstName: null, lastName: null, email: null }}
			/>,
		);

		expect(
			screen.getByText(/Un autre utilisateur modifie actuellement/),
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
