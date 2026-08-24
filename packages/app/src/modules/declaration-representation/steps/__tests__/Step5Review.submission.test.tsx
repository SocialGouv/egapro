import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, submitMutate, openModal, closeModal, submitState } = vi.hoisted(
	() => ({
		push: vi.fn(),
		submitMutate: vi.fn(),
		openModal: vi.fn(),
		closeModal: vi.fn(),
		submitState: {
			error: null as { message: string } | null,
			isPending: false,
			onSuccess: undefined as (() => void) | undefined,
		},
	}),
);

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push,
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
}));

vi.mock("~/modules/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("~/modules/shared")>()),
	useDsfrModal: () => ({
		modalRef: { current: null },
		open: openModal,
		close: closeModal,
	}),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		representationDeclaration: {
			submit: {
				useMutation: ({ onSuccess }: { onSuccess: () => void }) => {
					submitState.onSuccess = onSuccess;
					return {
						error: submitState.error,
						isPending: submitState.isPending,
						mutate: submitMutate,
					};
				},
			},
		},
	},
}));

import {
	COMPUTABLE_EXECUTIVES,
	COMPUTABLE_MEMBERS,
	REPRESENTATION_YEAR,
	VALID_REFERENCE_PERIOD,
	WEBSITE_PUBLICATION,
} from "~/modules/declaration-representation/__tests__/fixtures";
import {
	certifyModal,
	modalButton,
	queryModalCheckbox,
} from "~/modules/declaration-representation/__tests__/modalQueries";
import {
	FULLY_COMPLIANT,
	NOTHING_COMPUTABLE,
	PREVIOUS_HREF,
	renderReview,
} from "./step5ReviewHarness";

const CONFIRMATION_HREF = "/declaration-representation/confirmation";

function submitButton() {
	return screen.queryByRole("button", { name: "Soumettre" });
}

async function openSubmitModal() {
	const button = submitButton();
	if (button === null) throw new Error("Missing submit button.");
	await userEvent.click(button);
}

beforeEach(() => {
	push.mockReset();
	submitMutate.mockReset();
	openModal.mockReset();
	closeModal.mockReset();
	submitState.error = null;
	submitState.isPending = false;
	submitState.onSuccess = undefined;
});

describe("Step5Review — soumission (S19)", () => {
	it("opens the confirmation modal from the CTA without submitting", async () => {
		renderReview({ draft: FULLY_COMPLIANT });

		await openSubmitModal();

		expect(openModal).toHaveBeenCalledTimes(1);
		expect(submitMutate).not.toHaveBeenCalled();
	});

	it("submits the draft payload once the declarant certifies", async () => {
		renderReview({ draft: FULLY_COMPLIANT });

		await openSubmitModal();
		await certifyModal();
		await userEvent.click(modalButton("Valider"));

		expect(submitMutate).toHaveBeenCalledWith({
			payload: {
				...VALID_REFERENCE_PERIOD,
				...COMPUTABLE_EXECUTIVES,
				...COMPUTABLE_MEMBERS,
				...WEBSITE_PUBLICATION,
			},
			year: REPRESENTATION_YEAR,
		});
	});

	it("sends no publication key when no gap is computable (S12)", async () => {
		renderReview({ draft: { ...NOTHING_COMPUTABLE, ...WEBSITE_PUBLICATION } });

		await openSubmitModal();
		await certifyModal();
		await userEvent.click(modalButton("Valider"));

		expect(submitMutate).toHaveBeenCalledWith({
			payload: { ...VALID_REFERENCE_PERIOD, ...NOTHING_COMPUTABLE },
			year: REPRESENTATION_YEAR,
		});
	});

	it("keeps the submission locked until the declarant certifies", async () => {
		renderReview({ draft: FULLY_COMPLIANT });

		await openSubmitModal();

		expect(modalButton("Valider")).toBeDisabled();
	});

	it("closes the modal and lands on the confirmation screen on success", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		act(() => submitState.onSuccess?.());

		expect(closeModal).toHaveBeenCalledTimes(1);
		expect(push).toHaveBeenCalledWith(CONFIRMATION_HREF);
	});

	it("holds the modal while the submission is in flight", async () => {
		submitState.isPending = true;
		renderReview({ draft: FULLY_COMPLIANT });

		await openSubmitModal();
		await certifyModal();
		const button = modalButton("Envoi en cours…");

		expect(button).toHaveAttribute("aria-disabled", "true");
		expect(submitMutate).not.toHaveBeenCalled();
	});

	it("does not resubmit when the declarant clicks again during the flight", async () => {
		submitState.isPending = true;
		renderReview({ draft: FULLY_COMPLIANT });

		await openSubmitModal();
		await certifyModal();
		await userEvent.click(modalButton("Envoi en cours…"));

		expect(submitMutate).not.toHaveBeenCalled();
	});

	it("surfaces the submission failure without leaving the screen", () => {
		submitState.error = { message: "La soumission a échoué." };
		renderReview({ draft: FULLY_COMPLIANT });

		expect(screen.getByRole("alert")).toHaveTextContent(
			"La soumission a échoué.",
		);
		expect(push).not.toHaveBeenCalled();
	});
});

describe("Step5Review — navigation", () => {
	it("links back to the step the funnel came from", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		expect(screen.getByRole("link", { name: "Précédent" })).toHaveAttribute(
			"href",
			PREVIOUS_HREF,
		);
	});

	it("offers no submission while the campaign is closed (S23)", () => {
		renderReview({ draft: FULLY_COMPLIANT, isReadOnly: true });

		expect(submitButton()).not.toBeInTheDocument();
		expect(queryModalCheckbox()).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Précédent" })).toBeInTheDocument();
	});
});
