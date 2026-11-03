import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeclarationLockAlert } from "../DeclarationLockAlert";
import type { LockAlertFollowUp, LockHolderDisplay } from "../types";

const HOLDER: LockHolderDisplay = {
	firstName: "Camille",
	lastName: "Martin",
	email: "camille.martin@example.fr",
	lockTimeoutMinutes: 30,
};

describe("DeclarationLockAlert", () => {
	it("renders a DSFR warning alert with the lock title", () => {
		render(
			<DeclarationLockAlert
				followUp="watchThenRetake"
				holder={{
					firstName: "Camille",
					lastName: "Martin",
					email: "camille.martin@example.fr",
					lockTimeoutMinutes: 30,
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
				followUp="watchThenRetake"
				holder={{
					firstName: "Camille",
					lastName: "Martin",
					email: "camille.martin@example.fr",
					lockTimeoutMinutes: 30,
				}}
			/>,
		);

		expect(
			screen.getByText(
				/Camille Martin \(camille\.martin@example\.fr\) modifie actuellement/,
			),
		).toBeInTheDocument();

		const paragraph = screen.getByText(/modifie actuellement/).closest("p");
		expect(paragraph?.textContent).toContain(
			"(camille.martin@example.fr) modifie actuellement",
		);
	});

	it("shows the name without parentheses when the email is null", () => {
		render(
			<DeclarationLockAlert
				followUp="watchThenRetake"
				holder={{
					firstName: "Camille",
					lastName: "Martin",
					email: null,
					lockTimeoutMinutes: 30,
				}}
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
				followUp="watchThenRetake"
				holder={{
					firstName: null,
					lastName: null,
					email: "owner@example.fr",
					lockTimeoutMinutes: 30,
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
				followUp="watchThenRetake"
				holder={{
					firstName: null,
					lastName: null,
					email: null,
					lockTimeoutMinutes: 30,
				}}
			/>,
		);

		expect(
			screen.getByText(/^Un autre utilisateur modifie actuellement/),
		).toBeInTheDocument();
	});

	it("uses the available name part when only one of first/last is set", () => {
		render(
			<DeclarationLockAlert
				followUp="watchThenRetake"
				holder={{
					firstName: "Alice",
					lastName: null,
					email: "alice@example.fr",
					lockTimeoutMinutes: 30,
				}}
			/>,
		);

		expect(screen.getByText(/Alice \(alice@example\.fr\)/)).toBeInTheDocument();
	});

	it("states that the declaration is read-only without promising an end time", () => {
		render(<DeclarationLockAlert followUp="watchThenRetake" holder={HOLDER} />);

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent(
			"Camille Martin (camille.martin@example.fr) modifie actuellement cette déclaration. Vous pouvez la consulter en lecture seule.",
		);
		expect(alert).not.toHaveTextContent("jusqu'à la fin de sa modification");
		expect(alert).toHaveTextContent(
			"Tant qu'elle la garde ouverte, aucune heure de fin ne peut être annoncée.",
		);
		expect(alert.textContent).not.toMatch(/\d{1,2}\s?h\s?\d{2}|\d{1,2}:\d{2}/);
	});

	it("shows the timeout as a maximum after the holder leaves, in minutes", () => {
		render(<DeclarationLockAlert followUp="watchThenRetake" holder={HOLDER} />);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"Elle sera de nouveau modifiable dès que cette personne fermera sa page ou se déconnectera, et au plus tard 30 minutes après qu'elle aura quitté la déclaration.",
		);
	});

	it("uses the singular for a one-minute timeout", () => {
		render(
			<DeclarationLockAlert
				followUp="watchThenRetake"
				holder={{ ...HOLDER, lockTimeoutMinutes: 1 }}
			/>,
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"au plus tard 1 minute après qu'elle aura quitté la déclaration",
		);
	});

	it.each<[LockAlertFollowUp, string]>([
		[
			"watchThenRetake",
			"Cette page vérifie automatiquement si la déclaration se libère : vous pourrez alors passer en modification.",
		],
		[
			"watchThenAutoEdit",
			"Cette page vérifie automatiquement si la déclaration se libère et passera alors en modification.",
		],
		[
			"openToWatch",
			"Ouvrez la déclaration pour être prévenu dès qu'elle sera libérée.",
		],
		[
			"refreshToCheck",
			"Actualisez la page pour vérifier si elle est de nouveau modifiable.",
		],
	])("ends with the %s follow-up sentence", (followUp, sentence) => {
		render(<DeclarationLockAlert followUp={followUp} holder={HOLDER} />);

		const paragraphs = screen.getByRole("alert").querySelectorAll("p");
		expect(paragraphs[paragraphs.length - 1]).toHaveTextContent(sentence);
	});
});
