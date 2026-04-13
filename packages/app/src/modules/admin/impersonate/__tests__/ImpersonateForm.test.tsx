import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSessionMock = vi.fn();
const pushMock = vi.fn();
const searchMutate = vi.fn();
const searchMutationState: {
	data: unknown;
	isPending: boolean;
	onError?: (e: { message: string }) => void;
	onSuccess?: () => void;
} = { data: null, isPending: false };
const lastImpersonatedState: { data: Array<{ siren: string; name: string }> } =
	{
		data: [],
	};

vi.mock("next-auth/react", () => ({
	useSession: () => useSessionMock(),
	signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: pushMock,
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
	usePathname: vi.fn(),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		admin: {
			getLastImpersonated: {
				useQuery: () => lastImpersonatedState,
			},
			searchCompany: {
				useMutation: (opts: {
					onError?: (e: { message: string }) => void;
					onSuccess?: () => void;
				}) => {
					searchMutationState.onError = opts.onError;
					searchMutationState.onSuccess = opts.onSuccess;
					return {
						mutate: searchMutate,
						data: searchMutationState.data,
						isPending: searchMutationState.isPending,
					};
				},
			},
		},
	},
}));

import { ImpersonateForm } from "../ImpersonateForm";

describe("ImpersonateForm", () => {
	beforeEach(() => {
		useSessionMock.mockReset();
		pushMock.mockReset();
		searchMutate.mockReset();
		searchMutationState.data = null;
		searchMutationState.isPending = false;
		lastImpersonatedState.data = [];
		useSessionMock.mockReturnValue({
			data: { user: { isAdmin: true } },
			update: vi.fn().mockResolvedValue(undefined),
		});
	});

	it("rejects an invalid SIREN with a Zod error", async () => {
		render(<ImpersonateForm />);
		await userEvent.type(screen.getByLabelText(/SIREN/), "123");
		await userEvent.click(screen.getByRole("button", { name: /rechercher/i }));
		await waitFor(() => {
			expect(screen.getByText(/9 chiffres/i)).toBeInTheDocument();
		});
		expect(searchMutate).not.toHaveBeenCalled();
	});

	it("submits a valid SIREN to the search mutation", async () => {
		render(<ImpersonateForm />);
		await userEvent.type(screen.getByLabelText(/SIREN/), "123456789");
		await userEvent.click(screen.getByRole("button", { name: /rechercher/i }));
		await waitFor(() => {
			expect(searchMutate).toHaveBeenCalledWith({ siren: "123456789" });
		});
	});

	it("renders the preview and triggers session.update on start", async () => {
		searchMutationState.data = {
			siren: "123456789",
			name: "ACME",
			address: null,
			nafCode: null,
			workforce: null,
		};
		const update = vi.fn().mockResolvedValue(undefined);
		useSessionMock.mockReturnValue({
			data: { user: { isAdmin: true } },
			update,
		});
		render(<ImpersonateForm />);
		expect(screen.getByText("ACME")).toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("button", { name: /valider et mimoquer/i }),
		);
		expect(update).toHaveBeenCalledWith({
			impersonation: { siren: "123456789", name: "ACME" },
		});
		expect(pushMock).toHaveBeenCalledWith("/mon-espace");
	});

	it("renders datalist suggestions from getLastImpersonated", () => {
		lastImpersonatedState.data = [
			{ siren: "111111111", name: "Foo" },
			{ siren: "222222222", name: "Bar" },
		];
		const { container } = render(<ImpersonateForm />);
		const options = container.querySelectorAll("datalist option");
		expect(options).toHaveLength(2);
	});
});
