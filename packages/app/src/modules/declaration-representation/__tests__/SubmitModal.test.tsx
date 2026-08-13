import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RepresentationSubmitVariant } from "~/modules/declaration-representation/shared/reviewSummary";
import { SubmitModal } from "../SubmitModal";
import { REPRESENTATION_CAMPAIGN_YEAR } from "./fixtures";
import { certifyModal, modalButton, modalLiveRegion } from "./modalQueries";

const onClose = vi.fn();
const onSubmit = vi.fn();

function renderModal({
	isPending = false,
	variant = "compliant",
}: {
	isPending?: boolean;
	variant?: RepresentationSubmitVariant;
} = {}) {
	return render(
		<SubmitModal
			campaignYear={REPRESENTATION_CAMPAIGN_YEAR}
			isPending={isPending}
			modalRef={{ current: null }}
			onClose={onClose}
			onSubmit={onSubmit}
			variant={variant}
		/>,
	);
}

beforeEach(() => {
	onClose.mockReset();
	onSubmit.mockReset();
});

describe("SubmitModal — variants", () => {
	it.each([
		[
			"two_gaps",
			"Des écarts de représentation sont non conformes au seuil réglementaire actuel. Vous devez définir des mesures correctives par accord collectif ou par décision unilatérale de l'employeur, et les déposer sur TéléAccords.",
		],
		[
			"one_gap",
			"Un écart de représentation est non conforme au seuil réglementaire. Vous devez définir des mesures correctives par accord collectif ou par décision unilatérale de l'employeur, et les déposer sur TéléAccords.",
		],
		[
			"compliant",
			"Vos écarts de représentation sont conformes au seuil réglementaire actuel.",
		],
		["not_computable", "Vos écarts de représentation ne sont pas calculables."],
	] as const)("states the %s outcome", (variant, message) => {
		renderModal({ variant });

		expect(screen.getByText(message)).toBeInTheDocument();
	});

	it("announces the campaign the declaration is filed for", () => {
		renderModal();

		expect(
			screen.getByText(
				new RegExp(
					`Vous allez soumettre la déclaration des indicateurs de représentation ${REPRESENTATION_CAMPAIGN_YEAR}`,
				),
			),
		).toBeInTheDocument();
	});
});

describe("SubmitModal — confirmation", () => {
	it("labels itself as the submission dialog", () => {
		renderModal();

		const title = screen.getByRole("heading", {
			hidden: true,
			level: 2,
			name: "Soumettre",
		});

		const dialog = screen.getByRole("dialog", { hidden: true });
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(dialog).toHaveAttribute("aria-labelledby", title.id);
	});

	it("holds the submission until the declarant certifies the data", async () => {
		renderModal();

		expect(modalButton("Valider")).toBeDisabled();

		await certifyModal();
		await userEvent.click(modalButton("Valider"));

		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	// RGAA 7.5/12.8: a `disabled` button drops out of the tab order mid-submission and strands the keyboard focus.
	it("keeps the validation focusable but inert while the submission is in flight", async () => {
		renderModal({ isPending: true });

		await certifyModal();
		const button = modalButton("Envoi en cours…");

		expect(button).not.toBeDisabled();
		expect(button).toHaveAttribute("aria-disabled", "true");
		expect(screen.queryByText("Valider")).not.toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("ignores a second validation fired while the submission is in flight", async () => {
		renderModal({ isPending: true });

		await certifyModal();
		await userEvent.click(modalButton("Envoi en cours…"));
		await userEvent.click(modalButton("Envoi en cours…"));

		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("announces the ongoing submission in a polite live region", async () => {
		const { container } = renderModal({ isPending: true });

		await certifyModal();

		expect(modalLiveRegion(container)).toHaveTextContent("Envoi en cours…");
	});

	it("keeps the live region silent outside a submission", () => {
		const { container } = renderModal();

		expect(modalLiveRegion(container)).toBeEmptyDOMElement();
	});

	it("gives up on the submission from the cancel button", async () => {
		renderModal();

		await userEvent.click(modalButton("Annuler"));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
