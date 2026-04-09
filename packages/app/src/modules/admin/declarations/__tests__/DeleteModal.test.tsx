import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { DeleteModal } from "../DeleteConfirmationModal";

describe("DeleteModal", () => {
	it("renders confirmation text with count", () => {
		const modalRef = createRef<HTMLDialogElement>();
		render(
			<DeleteModal
				count={3}
				modalRef={modalRef}
				onClose={vi.fn()}
				onConfirm={vi.fn()}
			/>,
		);

		expect(screen.getByText(/3 déclarations/)).toBeInTheDocument();
		expect(screen.getByText(/irréversible/)).toBeInTheDocument();
	});

	it("renders singular text for count 1", () => {
		const modalRef = createRef<HTMLDialogElement>();
		render(
			<DeleteModal
				count={1}
				modalRef={modalRef}
				onClose={vi.fn()}
				onConfirm={vi.fn()}
			/>,
		);

		expect(screen.getByText(/1 déclaration/)).toBeInTheDocument();
		expect(screen.queryByText(/déclarations/)).not.toBeInTheDocument();
	});

	it("calls onConfirm and onClose when Supprimer is clicked", async () => {
		const onConfirm = vi.fn();
		const onClose = vi.fn();
		const user = userEvent.setup();
		const modalRef = createRef<HTMLDialogElement>();

		render(
			<DeleteModal
				count={2}
				modalRef={modalRef}
				onClose={onClose}
				onConfirm={onConfirm}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Supprimer", hidden: true }),
		);

		expect(onClose).toHaveBeenCalled();
		expect(onConfirm).toHaveBeenCalled();
	});

	it("calls onClose when Annuler is clicked", async () => {
		const onClose = vi.fn();
		const user = userEvent.setup();
		const modalRef = createRef<HTMLDialogElement>();

		render(
			<DeleteModal
				count={1}
				modalRef={modalRef}
				onClose={onClose}
				onConfirm={vi.fn()}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Annuler", hidden: true }),
		);

		expect(onClose).toHaveBeenCalled();
	});

	it("has correct modal accessibility attributes", () => {
		const modalRef = createRef<HTMLDialogElement>();
		render(
			<DeleteModal
				count={1}
				modalRef={modalRef}
				onClose={vi.fn()}
				onConfirm={vi.fn()}
			/>,
		);

		const dialog = screen.getByRole("dialog", { hidden: true });
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(dialog).toHaveAttribute("aria-labelledby");
	});
});
