import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DeclarationLockState } from "../useDeclarationLock";

const dynamicState: DeclarationLockState = {
	isReadOnly: true,
	reason: "lock",
	holder: null,
	isLoading: false,
};

vi.mock("../useDeclarationLock", () => ({
	useDeclarationLock: vi.fn(() => dynamicState),
}));

import type { LockHolder } from "../LockContext";
import {
	LockProvider,
	useLockContext,
	useReadOnlyContext,
} from "../LockContext";

const mockedUseSession = vi.mocked(useSession);

function ContextProbe() {
	const { isReadOnly, reason, holder } = useReadOnlyContext();
	return (
		<div>
			<span data-testid="read-only">{String(isReadOnly)}</span>
			<span data-testid="reason">{reason ?? "none"}</span>
			<span data-testid="holder">{holder ? holder.email : "none"}</span>
		</div>
	);
}

const holder: LockHolder = {
	firstName: "Camille",
	lastName: "Martin",
	email: "camille.martin@example.fr",
};

function mockImpersonating() {
	mockedUseSession.mockReturnValue({
		data: {
			user: {
				id: "admin-1",
				impersonation: { siren: "123456789", name: "Acme" },
			},
			expires: "2099-01-01",
		},
		status: "authenticated",
	} as unknown as ReturnType<typeof useSession>);
}

describe("LockContext — static provider", () => {
	afterEach(() => {
		mockedUseSession.mockReset();
	});

	it("exposes a default non-readonly state without a provider", () => {
		render(<ContextProbe />);

		expect(screen.getByTestId("read-only")).toHaveTextContent("false");
		expect(screen.getByTestId("reason")).toHaveTextContent("none");
		expect(screen.getByTestId("holder")).toHaveTextContent("none");
	});

	it("defaults to non-readonly with no reason or holder when no props are passed", () => {
		render(
			<LockProvider>
				<ContextProbe />
			</LockProvider>,
		);

		expect(screen.getByTestId("read-only")).toHaveTextContent("false");
		expect(screen.getByTestId("reason")).toHaveTextContent("none");
		expect(screen.getByTestId("holder")).toHaveTextContent("none");
	});

	it("derives reason 'lock' from a holder when read-only without an explicit reason", () => {
		render(
			<LockProvider holder={holder} isReadOnly>
				<ContextProbe />
			</LockProvider>,
		);

		expect(screen.getByTestId("read-only")).toHaveTextContent("true");
		expect(screen.getByTestId("reason")).toHaveTextContent("lock");
		expect(screen.getByTestId("holder")).toHaveTextContent(
			"camille.martin@example.fr",
		);
	});

	it("keeps an explicit reason prop over the holder-derived default", () => {
		render(
			<LockProvider holder={holder} isReadOnly reason="impersonation">
				<ContextProbe />
			</LockProvider>,
		);

		expect(screen.getByTestId("reason")).toHaveTextContent("impersonation");
	});

	it("folds impersonation into the unified context, overriding the props", () => {
		mockImpersonating();

		render(
			<LockProvider holder={holder} isReadOnly={false}>
				<ContextProbe />
			</LockProvider>,
		);

		expect(screen.getByTestId("read-only")).toHaveTextContent("true");
		expect(screen.getByTestId("reason")).toHaveTextContent("impersonation");
		// The lock holder is hidden during impersonation: the read-only reason is
		// the mimoquage, not another user holding the lock.
		expect(screen.getByTestId("holder")).toHaveTextContent("none");
	});
});

describe("LockContext — dynamic provider", () => {
	it("relays the lock state returned by useDeclarationLock", () => {
		render(
			<LockProvider declarationId="decl-1">
				<ContextProbe />
			</LockProvider>,
		);

		expect(screen.getByTestId("read-only")).toHaveTextContent("true");
		expect(screen.getByTestId("reason")).toHaveTextContent("lock");
	});
});

describe("LockContext — hook aliases", () => {
	it("useLockContext and useReadOnlyContext return the same context", () => {
		function AliasProbe() {
			const fromLock = useLockContext();
			const fromReadOnly = useReadOnlyContext();
			return (
				<span data-testid="same">
					{String(fromLock.isReadOnly === fromReadOnly.isReadOnly)}
				</span>
			);
		}

		render(
			<LockProvider isReadOnly reason="lock">
				<AliasProbe />
			</LockProvider>,
		);

		expect(screen.getByTestId("same")).toHaveTextContent("true");
	});
});
