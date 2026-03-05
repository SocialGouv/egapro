import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SubmitConfirmationModal } from "../components/SubmitConfirmationModal";

function renderOpenModal(props = {}) {
	const defaultProps = {
		modalRef: { current: null },
		onClose: vi.fn(),
		onSubmit: vi.fn(),
		...props,
	};
	const { container } = render(<SubmitConfirmationModal {...defaultProps} />);
	// Force dialog open for JSDOM testing
	const dialog = container.querySelector("dialog");
	dialog?.setAttribute("open", "");
	return { dialog: dialog as HTMLDialogElement, ...defaultProps };
}

describe("SubmitConfirmationModal", () => {
	it("renders the modal title", () => {
		const { dialog } = renderOpenModal();

		expect(within(dialog).getByText("Transmettre")).toBeInTheDocument();
	});

	it("renders the description text", () => {
		const { dialog } = renderOpenModal();

		expect(
			within(dialog).getByText(/transmettre aux services du ministère/),
		).toBeInTheDocument();
	});

	it("renders the certification checkbox unchecked by default", () => {
		const { dialog } = renderOpenModal();

		const checkbox = within(dialog).getByRole("checkbox", {
			name: /Je certifie que les avis transmis sont conformes/,
		});
		expect(checkbox).not.toBeChecked();
	});

	it("disables validate button when checkbox is unchecked", () => {
		const { dialog } = renderOpenModal();

		const validateButton = within(dialog).getByRole("button", {
			name: "Valider",
		});
		expect(validateButton).toBeDisabled();
	});

	it("enables validate button when checkbox is checked", async () => {
		const user = userEvent.setup();
		const { dialog } = renderOpenModal();

		await user.click(within(dialog).getByRole("checkbox"));

		const validateButton = within(dialog).getByRole("button", {
			name: "Valider",
		});
		expect(validateButton).toBeEnabled();
	});

	it("calls onSubmit when validate is clicked", async () => {
		const onSubmit = vi.fn();
		const user = userEvent.setup();
		const { dialog } = renderOpenModal({ onSubmit });

		await user.click(within(dialog).getByRole("checkbox"));
		await user.click(within(dialog).getByRole("button", { name: "Valider" }));

		expect(onSubmit).toHaveBeenCalledOnce();
	});

	it("calls onClose when annuler is clicked", async () => {
		const onClose = vi.fn();
		const user = userEvent.setup();
		const { dialog } = renderOpenModal({ onClose });

		await user.click(within(dialog).getByRole("button", { name: "Annuler" }));

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("renders close button", () => {
		const { dialog } = renderOpenModal();

		expect(
			within(dialog).getByRole("button", { name: "Fermer" }),
		).toBeInTheDocument();
	});
});
