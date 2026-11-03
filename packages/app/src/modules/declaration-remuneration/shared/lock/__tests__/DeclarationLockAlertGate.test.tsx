import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeclarationLockState } from "../types";

const HOLDER = {
	userId: "user-2",
	firstName: "Camille",
	lastName: "Martin",
	email: "camille.martin@example.fr",
	expiresAt: new Date("2026-11-03T12:00:00Z"),
	lockTimeoutMinutes: 30,
};

const LOCKED_OUT: DeclarationLockState = {
	isReadOnly: true,
	reason: "lock",
	holder: HOLDER,
	isLoading: false,
	retake: { isAvailable: false, status: "idle", retake: () => {} },
	editSessionKey: 0,
};

const lockState: { current: DeclarationLockState } = { current: LOCKED_OUT };

vi.mock("../useDeclarationLock", () => ({
	useDeclarationLock: () => lockState.current,
}));

import { DeclarationLockAlertGate } from "../DeclarationLockAlertGate";
import { LockProvider } from "../LockContext";
import { LockEditSessionBoundary } from "../LockEditSessionBoundary";

beforeEach(() => {
	lockState.current = LOCKED_OUT;
});

function renderGate() {
	return render(
		<LockProvider declarationId="decl-1">
			<DeclarationLockAlertGate />
		</LockProvider>,
	);
}

describe("DeclarationLockAlertGate", () => {
	it("shows the banner with the automatic-check follow-up, and a separate empty status region", () => {
		renderGate();

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent(
			"Cette page vérifie automatiquement si la déclaration se libère : vous pourrez alors passer en modification.",
		);
		const status = screen.getByRole("status");
		expect(status).toBeEmptyDOMElement();
		expect(alert.contains(status)).toBe(false);
	});

	it("shows the retake button under the banner once the declaration is released", () => {
		lockState.current = {
			...lockState.current,
			retake: { isAvailable: true, status: "idle", retake: () => {} },
		};
		renderGate();

		expect(
			screen.getByRole("button", { name: "Modifier la déclaration" }),
		).toBeInTheDocument();
	});

	it("hides the banner but keeps the status region once editable", () => {
		lockState.current = {
			...lockState.current,
			isReadOnly: false,
			reason: null,
			retake: { isAvailable: false, status: "succeeded", retake: () => {} },
		};
		renderGate();

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(screen.getByRole("status")).toHaveTextContent(
			"Vous pouvez maintenant modifier la déclaration.",
		);
	});
});

describe("LockEditSessionBoundary", () => {
	it("remounts its children when the edit session key changes", () => {
		const { rerender, container } = render(
			<LockProvider declarationId="decl-1">
				<LockEditSessionBoundary>
					<input defaultValue="before" />
				</LockEditSessionBoundary>
			</LockProvider>,
		);
		const input = container.querySelector("input");
		if (input) input.value = "typed";

		lockState.current = { ...lockState.current, editSessionKey: 1 };
		rerender(
			<LockProvider declarationId="decl-1">
				<LockEditSessionBoundary>
					<input defaultValue="before" />
				</LockEditSessionBoundary>
			</LockProvider>,
		);

		expect(container.querySelector("input")).not.toBe(input);
		expect(container.querySelector("input")?.value).toBe("before");
	});

	it("keeps its children mounted without a dynamic lock", () => {
		const { container, rerender } = render(
			<LockProvider>
				<LockEditSessionBoundary>
					<input defaultValue="before" />
				</LockEditSessionBoundary>
			</LockProvider>,
		);
		const input = container.querySelector("input");

		rerender(
			<LockProvider>
				<LockEditSessionBoundary>
					<input defaultValue="before" />
				</LockEditSessionBoundary>
			</LockProvider>,
		);

		expect(container.querySelector("input")).toBe(input);
	});
});
