import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DeclarationLockState } from "../useDeclarationLock";

const dynamicState: DeclarationLockState = {
	isReadOnly: true,
	holder: null,
	isLoading: false,
};

vi.mock("../useDeclarationLock", () => ({
	useDeclarationLock: vi.fn(() => dynamicState),
}));

import type { LockHolder } from "../LockContext";
import { LockProvider, useLockContext } from "../LockContext";

function ContextProbe() {
	const { isReadOnly, holder } = useLockContext();
	return (
		<div>
			<span data-testid="read-only">{String(isReadOnly)}</span>
			<span data-testid="holder">{holder ? holder.email : "none"}</span>
		</div>
	);
}

const holder: LockHolder = {
	firstName: "Camille",
	lastName: "Martin",
	email: "camille.martin@example.fr",
};

describe("LockContext — static provider", () => {
	it("exposes a default non-readonly state without a provider", () => {
		render(<ContextProbe />);

		expect(screen.getByTestId("read-only")).toHaveTextContent("false");
		expect(screen.getByTestId("holder")).toHaveTextContent("none");
	});

	it("defaults to non-readonly with no holder when no props are passed", () => {
		render(
			<LockProvider>
				<ContextProbe />
			</LockProvider>,
		);

		expect(screen.getByTestId("read-only")).toHaveTextContent("false");
		expect(screen.getByTestId("holder")).toHaveTextContent("none");
	});

	it("propagates isReadOnly and holder when provided", () => {
		render(
			<LockProvider holder={holder} isReadOnly>
				<ContextProbe />
			</LockProvider>,
		);

		expect(screen.getByTestId("read-only")).toHaveTextContent("true");
		expect(screen.getByTestId("holder")).toHaveTextContent(
			"camille.martin@example.fr",
		);
	});
});

describe("LockContext — dynamic provider", () => {
	it("exposes the lock state returned by useDeclarationLock", () => {
		function Consumer() {
			const state = useLockContext();
			return <span>{state.isReadOnly ? "read-only" : "editable"}</span>;
		}

		render(
			<LockProvider declarationId="decl-1">
				<Consumer />
			</LockProvider>,
		);

		expect(screen.getByText("read-only")).toBeInTheDocument();
	});
});
