import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DECLARATION_LOCK_CONFLICT_MESSAGE } from "~/modules/domain";

import { FormErrors } from "../FormErrors";
import { LockProvider } from "../lock/LockContext";

describe("FormErrors", () => {
	it("renders nothing when there is no error", () => {
		render(<FormErrors />);

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("renders the validation error as-is", () => {
		render(<FormErrors validationError="Champ requis" />);

		const alert = screen.getByRole("alert");
		expect(alert).toHaveClass("fr-alert", "fr-alert--error");
		expect(alert).toHaveTextContent("Champ requis");
	});

	it("renders a non-lock mutation error unchanged", () => {
		render(<FormErrors mutationError="Erreur serveur inattendue" />);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"Erreur serveur inattendue",
		);
	});

	it("renders both alerts when validation and mutation errors are both present", () => {
		render(
			<FormErrors
				mutationError="Erreur serveur"
				validationError="Champ requis"
			/>,
		);

		const alerts = screen.getAllByRole("alert");
		expect(alerts).toHaveLength(2);
		expect(alerts[0]).toHaveTextContent("Champ requis");
		expect(alerts[1]).toHaveTextContent("Erreur serveur");
	});

	it("names the lock holder when the mutation error is the lock-conflict sentinel", () => {
		render(
			<LockProvider
				holder={{
					firstName: "Camille",
					lastName: "Martin",
					email: "camille.martin@example.fr",
				}}
				isReadOnly
			>
				<FormErrors mutationError={DECLARATION_LOCK_CONFLICT_MESSAGE} />
			</LockProvider>,
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"Déclaration verrouillée par Camille Martin (camille.martin@example.fr).",
		);
	});

	it("keeps the generic message when a holder is set but this tab is not locked out", () => {
		render(
			<LockProvider
				holder={{
					firstName: "Camille",
					lastName: "Martin",
					email: "camille.martin@example.fr",
				}}
			>
				<FormErrors mutationError={DECLARATION_LOCK_CONFLICT_MESSAGE} />
			</LockProvider>,
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			DECLARATION_LOCK_CONFLICT_MESSAGE,
		);
	});

	it("keeps the generic message when the lock holder is not yet known", () => {
		render(<FormErrors mutationError={DECLARATION_LOCK_CONFLICT_MESSAGE} />);

		expect(screen.getByRole("alert")).toHaveTextContent(
			DECLARATION_LOCK_CONFLICT_MESSAGE,
		);
	});

	it("keeps the generic message when the lock holder has no exploitable identity", () => {
		render(
			<LockProvider
				holder={{ firstName: null, lastName: null, email: null }}
				isReadOnly
			>
				<FormErrors mutationError={DECLARATION_LOCK_CONFLICT_MESSAGE} />
			</LockProvider>,
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			DECLARATION_LOCK_CONFLICT_MESSAGE,
		);
	});
});
