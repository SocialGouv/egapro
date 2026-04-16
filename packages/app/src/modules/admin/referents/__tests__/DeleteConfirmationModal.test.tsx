import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { DeleteModal } from "../DeleteConfirmationModal";

function renderModal(count = 3) {
	const onClose = vi.fn();
	const onConfirm = vi.fn();
	const modalRef = createRef<HTMLDialogElement>();
	render(
		<DeleteModal
			count={count}
			modalRef={modalRef}
			onClose={onClose}
			onConfirm={onConfirm}
		/>,
	);
	return { onClose, onConfirm };
}

describe("DeleteModal", () => {
	it("renders the confirmation title", () => {
		renderModal();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Confirmer la suppression",
				hidden: true,
			}),
		).toBeInTheDocument();
	});

	it("pluralizes the count when greater than 1", () => {
		renderModal(3);
		expect(screen.getByText("3 référents")).toBeInTheDocument();
	});

	it("uses the singular form when count is 1", () => {
		renderModal(1);
		expect(screen.getByText("1 référent")).toBeInTheDocument();
	});

	it("calls onClose then onConfirm when confirming", () => {
		const { onClose, onConfirm } = renderModal(2);
		fireEvent.click(
			screen.getByRole("button", { name: "Supprimer", hidden: true }),
		);
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("calls onClose on Annuler", () => {
		const { onClose, onConfirm } = renderModal(2);
		fireEvent.click(
			screen.getByRole("button", { name: "Annuler", hidden: true }),
		);
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it("calls onClose on the Fermer button", () => {
		const { onClose } = renderModal(2);
		fireEvent.click(
			screen.getByRole("button", { name: "Fermer", hidden: true }),
		);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
