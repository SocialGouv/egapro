import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DeclarationLockState } from "../useDeclarationLock";

const lockState: DeclarationLockState = {
	isReadOnly: true,
	holder: null,
	isLoading: false,
};

vi.mock("../useDeclarationLock", () => ({
	useDeclarationLock: vi.fn(() => lockState),
}));

import { LockProvider, useLockContext } from "../LockContext";

describe("LockContext", () => {
	it("exposes the lock state computed by the hook to consumers", () => {
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

	it("throws when useLockContext is used outside a LockProvider", () => {
		expect(() => renderHook(() => useLockContext())).toThrow(
			"useLockContext must be used within a LockProvider",
		);
	});
});
