import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The component owns the outcome message, so the mock hands the callbacks back.
const { mutation } = vi.hoisted(() => ({
	mutation: {
		isPending: false,
		mutate: vi.fn(),
		onError: undefined as (() => void) | undefined,
		onSuccess: undefined as (() => void) | undefined,
	},
}));

vi.mock("~/trpc/react", () => ({
	api: {
		mail: {
			resendReceipt: {
				useMutation: (options: {
					onError: () => void;
					onSuccess: () => void;
				}) => {
					mutation.onError = options.onError;
					mutation.onSuccess = options.onSuccess;
					return { isPending: mutation.isPending, mutate: mutation.mutate };
				},
			},
		},
	},
}));

import { ResendReceiptButton } from "../ResendReceiptButton";

const YEAR = 2025;

const SUCCESS_MESSAGE = "L'accusé de réception a été renvoyé.";
const ERROR_MESSAGE =
	"Impossible de renvoyer l'accusé de réception. Réessayez plus tard.";

function resendButton() {
	return screen.getByRole("button", {
		name: /Renvoyer l'accusé de réception|Envoi en cours/,
	});
}

function liveRegion() {
	return screen.getByRole("status");
}

beforeEach(() => {
	mutation.isPending = false;
	mutation.mutate.mockClear();
});

describe("ResendReceiptButton", () => {
	it("renders at the default DSFR size", () => {
		render(<ResendReceiptButton kind="declaration" year={YEAR} />);

		expect(resendButton()).toHaveClass("fr-btn", "fr-btn--tertiary");
		expect(resendButton()).not.toHaveClass("fr-btn--sm");
	});

	// The banners keep the small variant; only the confirmation screens take 40px.
	it("takes the small DSFR variant when asked for it", () => {
		render(<ResendReceiptButton kind="cseOpinion" size="sm" year={YEAR} />);

		expect(resendButton()).toHaveClass("fr-btn--sm");
	});

	it("resends the receipt for its kind and year", async () => {
		render(<ResendReceiptButton kind="cseOpinion" year={YEAR} />);

		await userEvent.click(resendButton());

		expect(mutation.mutate).toHaveBeenCalledWith({
			kind: "cseOpinion",
			year: YEAR,
		});
	});

	it("locks the button while the receipt is on its way", () => {
		mutation.isPending = true;
		render(<ResendReceiptButton kind="declaration" year={YEAR} />);

		expect(resendButton()).toBeDisabled();
		expect(resendButton()).toHaveTextContent("Envoi en cours…");
	});

	// Stays mounted to announce the outcome, but an empty region must not take space.
	it("keeps the idle live region empty and free of vertical spacing", () => {
		render(<ResendReceiptButton kind="declaration" year={YEAR} />);

		expect(liveRegion()).toBeEmptyDOMElement();
		expect(liveRegion()).not.toHaveClass("fr-mt-1w");
	});

	it.each([
		{ fire: () => mutation.onSuccess?.(), message: SUCCESS_MESSAGE },
		{ fire: () => mutation.onError?.(), message: ERROR_MESSAGE },
	])("announces the outcome and spaces the region out ($message)", ({
		fire,
		message,
	}) => {
		render(<ResendReceiptButton kind="declaration" year={YEAR} />);

		act(fire);

		expect(liveRegion()).toHaveTextContent(message);
		expect(liveRegion()).toHaveClass("fr-mt-1w");
	});

	it("clears the previous outcome when the user tries again", async () => {
		render(<ResendReceiptButton kind="declaration" year={YEAR} />);
		act(() => mutation.onError?.());

		await userEvent.click(resendButton());

		expect(liveRegion()).toBeEmptyDOMElement();
	});
});
