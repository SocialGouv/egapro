import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RepresentationSubmitVariant } from "~/modules/declaration-representation/shared/reviewSummary";
import { SubmitModal } from "../SubmitModal";
import { REPRESENTATION_CAMPAIGN_YEAR } from "./fixtures";

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

// The DSFR runtime is absent in jsdom, so the <dialog> stays closed and its
// content sits outside the accessibility tree.
function modalButton(name: string) {
	return screen.getByRole("button", { hidden: true, name });
}

function certifyCheckbox() {
	return screen.getByRole("checkbox", { hidden: true });
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

		await userEvent.click(certifyCheckbox());
		await userEvent.click(modalButton("Valider"));

		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it("keeps the certification locked out while the submission is in flight", async () => {
		renderModal({ isPending: true });

		await userEvent.click(certifyCheckbox());

		expect(modalButton("Envoi en cours…")).toBeDisabled();
		expect(screen.queryByText("Valider")).not.toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("gives up on the submission from the cancel button", async () => {
		renderModal();

		await userEvent.click(modalButton("Annuler"));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
