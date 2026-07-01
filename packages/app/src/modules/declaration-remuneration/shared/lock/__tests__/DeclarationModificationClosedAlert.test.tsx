import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DeclarationLockState } from "../useDeclarationLock";

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

const DEADLINE = new Date("2026-03-01T00:00:00Z");

describe("DeclarationModificationClosedAlert", () => {
	afterEach(() => {
		contextState.reason = null;
	});

	it("renders the info alert with the deadline when the reason is modification_closed", () => {
		contextState.reason = "modification_closed";
		const { container } = render(
			<DeclarationModificationClosedAlert deadline={DEADLINE} />,
		);

		const alert = container.querySelector("div.fr-alert");
		expect(alert).toHaveClass("fr-alert--info", "fr-alert--sm");
		expect(
			screen.getByText(/Votre déclaration n'est plus modifiable/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/consulter chaque étape en lecture seule/),
		).toBeInTheDocument();
	});

	it("renders the deadline through OrdinalLongDate (1er mars 2026)", () => {
		contextState.reason = "modification_closed";
		const { container } = render(
			<DeclarationModificationClosedAlert deadline={DEADLINE} />,
		);

		expect(container.querySelector("sup")?.textContent).toBe("er");
		expect(container.textContent).toContain(
			"modification close depuis le 1er mars 2026",
		);
	});

	it("renders nothing when the reason is lock", () => {
		contextState.reason = "lock";
		const { container } = render(
			<DeclarationModificationClosedAlert deadline={DEADLINE} />,
		);

		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing when the reason is impersonation", () => {
		contextState.reason = "impersonation";
		const { container } = render(
			<DeclarationModificationClosedAlert deadline={DEADLINE} />,
		);

		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing when there is no read-only reason", () => {
		contextState.reason = null;
		const { container } = render(
			<DeclarationModificationClosedAlert deadline={DEADLINE} />,
		);

		expect(container).toBeEmptyDOMElement();
	});
});
