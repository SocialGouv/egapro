import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

const acquireMutateAsync = vi.fn();
const heartbeatMutateAsync = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declarationLock: {
			acquireLock: { useMutation: () => ({ mutateAsync: acquireMutateAsync }) },
			heartbeat: { useMutation: () => ({ mutateAsync: heartbeatMutateAsync }) },
		},
	},
}));

import { DeclarationLayout } from "../DeclarationLayout";
import { useLockContext } from "../shared/lock/LockContext";

const useSessionMock = useSession as unknown as Mock;

const company = {
	name: "Alpha Solutions",
	siren: "123456789",
	nafCode: "62.01Z",
	nafLabel: "Programmation informatique",
	gipWorkforce: 256,
	hasCse: true,
};

const lockHolder = {
	firstName: "Camille",
	lastName: "Martin",
	email: "camille.martin@example.fr",
};

function LockProbe() {
	const { isReadOnly, holder } = useLockContext();
	return (
		<span data-testid="lock-probe">{`${isReadOnly}:${holder?.email ?? "none"}`}</span>
	);
}

function declarationLayout(lockAcquisitionSuspended = false) {
	// The lock hook watches the mutation cache for lock-conflict rejections, so
	// it needs a query client just like it does under `TRPCReactProvider`.
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});
	return (
		<QueryClientProvider client={queryClient}>
			<DeclarationLayout
				company={company}
				declarationId="decl-1"
				declarationYear={2024}
				lockAcquisitionSuspended={lockAcquisitionSuspended}
			>
				<p>Step content</p>
				<LockProbe />
			</DeclarationLayout>
		</QueryClientProvider>
	);
}

beforeEach(() => {
	acquireMutateAsync.mockReset();
	heartbeatMutateAsync.mockReset();
	acquireMutateAsync.mockResolvedValue({ acquired: true, holder: null });
	useSessionMock.mockReturnValue({
		data: { user: { id: "user-1", impersonation: null } },
		status: "authenticated",
	});
});

describe("DeclarationLayout", () => {
	it("renders the children inside the banner layout", async () => {
		render(declarationLayout());

		expect(await screen.findByText("Step content")).toBeInTheDocument();
	});

	it("shows the lock alert when the declaration is held by another user", async () => {
		acquireMutateAsync.mockResolvedValue({
			acquired: false,
			holder: lockHolder,
		});
		render(declarationLayout());

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Déclaration en cours de modification",
		);
		expect(
			screen.getByText(/Camille Martin \(camille\.martin@example\.fr\)/),
		).toBeInTheDocument();
	});

	it("does not show the lock alert once the lock is acquired", async () => {
		render(declarationLayout());

		expect(await screen.findByTestId("lock-probe")).toHaveTextContent(
			"false:none",
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("does not show the lock alert when read-only but no holder is resolved", async () => {
		acquireMutateAsync.mockResolvedValue({ acquired: false, holder: null });
		render(declarationLayout());

		expect(await screen.findByTestId("lock-probe")).toHaveTextContent(
			"true:none",
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("provides the lock state to descendant consumers", async () => {
		acquireMutateAsync.mockResolvedValue({
			acquired: false,
			holder: lockHolder,
		});
		render(declarationLayout());

		expect(await screen.findByTestId("lock-probe")).toHaveTextContent(
			"true:camille.martin@example.fr",
		);
	});
});

// The lock is shared by every page of the `(with-banner)` group, so it may only
// be skipped once *nothing* under it is writable. The compliance-path pages keep
// writing for months after `decl1ModificationDeadline` elapses.
describe("DeclarationLayout — collaborative lock acquisition", () => {
	it.each([
		{
			acquires: true,
			lockAcquisitionSuspended: false,
			scenario: "a writable surface remains under the route group",
		},
		{
			acquires: false,
			lockAcquisitionSuspended: true,
			scenario: "démarche completed and the modification deadline elapsed",
		},
	])("$scenario → acquires: $acquires", async ({
		acquires,
		lockAcquisitionSuspended,
	}) => {
		render(declarationLayout(lockAcquisitionSuspended));
		await screen.findByTestId("lock-probe");

		if (acquires) {
			expect(acquireMutateAsync).toHaveBeenCalledWith({
				declarationId: "decl-1",
			});
		} else {
			expect(acquireMutateAsync).not.toHaveBeenCalled();
		}
	});

	it("keeps the démarche read-only without a holder when the lock is skipped", () => {
		render(declarationLayout(true));

		expect(screen.getByTestId("lock-probe")).toHaveTextContent("true:none");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
