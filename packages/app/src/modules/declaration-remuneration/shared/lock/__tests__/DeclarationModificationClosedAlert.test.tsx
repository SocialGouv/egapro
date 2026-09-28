import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DeclarationLockState } from "../types";

const contextState: DeclarationLockState = {
	isReadOnly: false,
	reason: null,
	holder: null,
	isLoading: false,
};

vi.mock("../LockContext", () => ({
	useLockContext: () => contextState,
}));

import { DeclarationModificationClosedAlert } from "../DeclarationModificationClosedAlert";

describe("DeclarationModificationClosedAlert", () => {
	afterEach(() => {
		contextState.reason = null;
	});

	it("renders the info alert when the reason is modification_closed", () => {
		contextState.reason = "modification_closed";
		const { container } = render(<DeclarationModificationClosedAlert />);

		const alert = container.querySelector("div.fr-alert");
		expect(alert).toHaveClass("fr-alert--info", "fr-alert--sm");
		expect(
			screen.getByText(/Votre déclaration n'est plus modifiable/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/consulter chaque étape en lecture seule/),
		).toBeInTheDocument();
	});

	it("says a later step was transmitted, without any date", () => {
		contextState.reason = "modification_closed";
		const { container } = render(<DeclarationModificationClosedAlert />);

		expect(container.textContent).toBe(
			"Votre déclaration n'est plus modifiable : une étape suivante de votre démarche a déjà été transmise (seconde déclaration, rapport d'évaluation conjointe ou avis du CSE). À titre d'information, vous pouvez consulter chaque étape en lecture seule.",
		);
		expect(container.textContent).not.toMatch(/modification close depuis/);
		expect(container.querySelector("sup")).toBeNull();
	});

	it("renders nothing when the reason is lock", () => {
		contextState.reason = "lock";
		const { container } = render(<DeclarationModificationClosedAlert />);

		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing when the reason is impersonation", () => {
		contextState.reason = "impersonation";
		const { container } = render(<DeclarationModificationClosedAlert />);

		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing when there is no read-only reason", () => {
		contextState.reason = null;
		const { container } = render(<DeclarationModificationClosedAlert />);

		expect(container).toBeEmptyDOMElement();
	});
});
