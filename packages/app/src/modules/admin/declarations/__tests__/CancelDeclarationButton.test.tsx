import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockMutate, mockOpen, mockClose } = vi.hoisted(() => ({
	mockMutate: vi.fn(),
	mockOpen: vi.fn(),
	mockClose: vi.fn(),
}));

vi.mock("~/modules/domain", () => ({
	getCurrentYear: () => 2026,
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
			cancel: {
				useMutation: vi.fn().mockReturnValue({
					mutate: mockMutate,
					isPending: false,
				}),
			},
		},
		useUtils: vi.fn().mockReturnValue({
			adminDeclarations: {
				getById: { invalidate: vi.fn() },
				search: { invalidate: vi.fn() },
			},
		}),
	},
}));

import { CancelDeclarationButton } from "../CancelDeclarationButton";

describe("CancelDeclarationButton", () => {
	it("renders the button for a current year non-cancelled declaration", () => {
		render(
			<CancelDeclarationButton
				cancelledAt={null}
				declarationId="decl-1"
				year={2026}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Annuler la déclaration" }),
		).toBeInTheDocument();
	});

	it("renders nothing for a past campaign year", () => {
		render(
			<CancelDeclarationButton
				cancelledAt={null}
				declarationId="decl-1"
				year={2024}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Annuler la déclaration" }),
		).toBeNull();
	});

	it("renders nothing for an already cancelled declaration", () => {
		render(
			<CancelDeclarationButton
				cancelledAt={new Date("2026-03-01T10:00:00Z")}
				declarationId="decl-1"
				year={2026}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Annuler la déclaration" }),
		).toBeNull();
	});
});
