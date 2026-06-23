import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockMutate, mockOpen, mockClose, mockInvalidate, mutationOptions } =
	vi.hoisted(() => ({
		mockMutate: vi.fn(),
		mockOpen: vi.fn(),
		mockClose: vi.fn(),
		mockInvalidate: vi.fn(),
		mutationOptions: { onSuccess: undefined, onError: undefined } as {
			onSuccess?: () => Promise<void> | void;
			onError?: (err: { message: string }) => void;
		},
	}));

vi.mock("~/modules/shared", () => ({
	useDsfrModal: () => ({
		modalRef: { current: null },
		open: mockOpen,
		close: mockClose,
	}),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		adminDeclarations: {
			releaseLock: {
				useMutation: vi.fn().mockImplementation((options) => {
					mutationOptions.onSuccess = options?.onSuccess;
					mutationOptions.onError = options?.onError;
					return { mutate: mockMutate, isPending: false };
				}),
			},
		},
		useUtils: vi.fn().mockReturnValue({
			adminDeclarations: {
				getById: { invalidate: mockInvalidate },
			},
		}),
	},
}));

import { UnlockDeclarationButton } from "../UnlockDeclarationButton";

describe("UnlockDeclarationButton", () => {
	it("renders nothing when the declaration is not locked", () => {
		render(<UnlockDeclarationButton declarationId="decl-1" isLocked={false} />);

		expect(
			screen.queryByRole("button", { name: "Déverrouiller la déclaration" }),
		).toBeNull();
	});

	it("renders the button when the declaration is locked", () => {
		render(<UnlockDeclarationButton declarationId="decl-1" isLocked />);

		expect(
			screen.getByRole("button", { name: "Déverrouiller la déclaration" }),
		).toBeInTheDocument();
	});

	it("triggers the release mutation on confirmation", () => {
		render(<UnlockDeclarationButton declarationId="decl-1" isLocked />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Confirmer le déverrouillage",
				hidden: true,
			}),
		);

		expect(mockMutate).toHaveBeenCalledWith({ declarationId: "decl-1" });
	});

	it("closes the modal when the cancel button is clicked", () => {
		render(<UnlockDeclarationButton declarationId="decl-1" isLocked />);

		fireEvent.click(
			screen.getByRole("button", { name: "Annuler", hidden: true }),
		);

		expect(mockClose).toHaveBeenCalled();
	});

	it("closes the modal and invalidates the detail query on success", async () => {
		render(<UnlockDeclarationButton declarationId="decl-1" isLocked />);

		await act(async () => {
			await mutationOptions.onSuccess?.();
		});

		expect(mockClose).toHaveBeenCalled();
		expect(mockInvalidate).toHaveBeenCalledWith({ id: "decl-1" });
	});

	it("displays the error message returned by the mutation", () => {
		render(<UnlockDeclarationButton declarationId="decl-1" isLocked />);

		act(() => {
			mutationOptions.onError?.({ message: "aucun verrou actif" });
		});

		expect(screen.getByRole("alert", { hidden: true })).toHaveTextContent(
			"aucun verrou actif",
		);
	});
});
