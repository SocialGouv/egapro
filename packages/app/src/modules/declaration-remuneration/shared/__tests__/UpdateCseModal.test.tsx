import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("~/modules/auth", () => ({
	useReadOnlyGuard: () => ({
		buttonProps: {},
		isReadOnly: false,
		tooltip: null,
	}),
}));

vi.mock("~/modules/my-space/useUpdateHasCse", () => ({
	useUpdateHasCse: () => ({ mutate: mocks.mutate, isPending: false }),
}));

import { UpdateCseModal } from "../UpdateCseModal";

const SIREN = "123456789";

// The dialog is never opened in these tests, and a closed <dialog> is hidden
// from the accessibility tree — hence `hidden: true` on every role query.
describe("UpdateCseModal", () => {
	beforeEach(() => {
		mocks.mutate.mockClear();
	});

	// The server rejects the mutation below the CSE threshold, so offering the
	// control there would only ever produce a PRECONDITION_FAILED. The guard used
	// to live in the caller, where it could be forgotten.
	it("renders nothing when the CSE question does not apply to the company", () => {
		const { container } = render(
			<UpdateCseModal cseApplicable={false} siren={SIREN} />,
		);

		expect(container).toBeEmptyDOMElement();
	});

	it("renders the dialog when the CSE question applies", () => {
		render(<UpdateCseModal cseApplicable siren={SIREN} />);

		expect(
			screen.getByRole("heading", {
				hidden: true,
				name: "Mettre à jour la présence d'un CSE",
			}),
		).toBeInTheDocument();
	});

	it("keeps the save button disabled until an answer is picked", async () => {
		render(<UpdateCseModal cseApplicable siren={SIREN} />);

		const save = screen.getByRole("button", {
			hidden: true,
			name: "Enregistrer",
		});
		expect(save).toBeDisabled();

		await userEvent.click(
			screen.getByRole("button", { hidden: true, name: "Oui" }),
		);
		expect(save).toBeEnabled();
	});

	it("submits the picked answer for the company", async () => {
		render(<UpdateCseModal cseApplicable siren={SIREN} />);

		await userEvent.click(
			screen.getByRole("button", { hidden: true, name: "Non" }),
		);
		await userEvent.click(
			screen.getByRole("button", { hidden: true, name: "Enregistrer" }),
		);

		expect(mocks.mutate).toHaveBeenCalledWith({ hasCse: false, siren: SIREN });
	});
});
