import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { updateHasCseAsync, updatePhoneAsync, mockRefresh } = vi.hoisted(() => ({
	updateHasCseAsync: vi.fn().mockResolvedValue(undefined),
	updatePhoneAsync: vi.fn().mockResolvedValue(undefined),
	mockRefresh: vi.fn(),
}));

// Override the global next/navigation mock (src/test/setup.ts) which recreates a
// fresh `refresh` fn on every useRouter() call. A stable instance is required to
// assert router.refresh() is invoked after the mutations resolve (#4056).
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		refresh: mockRefresh,
	}),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		company: {
			updateHasCse: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					mutateAsync: updateHasCseAsync,
					isPending: false,
				}),
			},
		},
		profile: {
			updatePhone: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					mutateAsync: updatePhoneAsync,
					isPending: false,
				}),
			},
		},
	},
}));

import { DECLARATION_PROCESS_PANEL_ID } from "../DeclarationProcessPanel";
import { MISSING_INFO_PANEL_ID, MissingInfoModal } from "../MissingInfoModal";
import { REPRESENTATION_PROCESS_PANEL_ID } from "../RepresentationProcessPanel";

const appended: HTMLElement[] = [];

function appendElement<T extends HTMLElement>(element: T): T {
	document.body.appendChild(element);
	appended.push(element);
	return element;
}

function appendPanel(id: string): HTMLElement {
	const panel = document.createElement("div");
	panel.id = id;
	return appendElement(panel);
}

function appendOpener(declarationType?: string): HTMLButtonElement {
	const opener = document.createElement("button");
	opener.setAttribute("aria-controls", MISSING_INFO_PANEL_ID);
	if (declarationType) opener.dataset.declarationType = declarationType;
	return appendElement(opener);
}

// Spies capture the resolved element id so tests assert *which* panel was disclosed.
function stubDsfrModal() {
	const conceal = vi.fn();
	const disclose = vi.fn();
	(
		window as unknown as {
			dsfr: (el: HTMLElement) => {
				modal: { conceal: () => void; disclose: () => void };
			};
		}
	).dsfr = (el) => ({
		modal: {
			conceal: () => conceal(el.id),
			disclose: () => disclose(el.id),
		},
	});
	return { conceal, disclose };
}

function getDialog(container: HTMLElement): HTMLDialogElement {
	return container.querySelector(
		`#${MISSING_INFO_PANEL_ID}`,
	) as HTMLDialogElement;
}

describe("MissingInfoModal — refreshes the RSC props after saving (#4056)", () => {
	beforeEach(() => {
		mockRefresh.mockClear();
		updateHasCseAsync.mockClear();
		updatePhoneAsync.mockClear();
	});

	afterEach(() => {
		for (const element of appended) element.remove();
		appended.length = 0;
		delete (window as unknown as { dsfr?: unknown }).dsfr;
	});

	it("calls router.refresh after the CSE mutation resolves", async () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);

		fireEvent.click(screen.getByLabelText("Non"));
		fireEvent.click(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		);

		await waitFor(() => {
			expect(updateHasCseAsync).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(mockRefresh).toHaveBeenCalledTimes(1);
		});
	});

	it("calls router.refresh after the phone mutation resolves", async () => {
		render(
			<MissingInfoModal
				cseApplicable={false}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);

		fireEvent.change(screen.getByLabelText(/Numéro de téléphone/), {
			target: { value: "0612345678" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		);

		await waitFor(() => {
			expect(updatePhoneAsync).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(mockRefresh).toHaveBeenCalledTimes(1);
		});
	});

	it("does not call router.refresh when validation fails before any mutation", async () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		);

		await waitFor(() => {
			expect(
				document.querySelector("#missing-info-cse-error .fr-message--error"),
			).toBeInTheDocument();
		});
		expect(updateHasCseAsync).not.toHaveBeenCalled();
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it("shows an error and skips the refresh when a mutation rejects", async () => {
		updateHasCseAsync.mockRejectedValueOnce(new Error("network"));
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);

		fireEvent.click(screen.getByLabelText("Non"));
		fireEvent.click(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		);

		await waitFor(() => {
			expect(
				screen.getByText(
					"Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
				),
			).toBeInTheDocument();
		});
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it("discloses the declaration process panel once the remuneration modal is concealed", async () => {
		const { conceal, disclose } = stubDsfrModal();
		appendPanel(DECLARATION_PROCESS_PANEL_ID);

		const { container } = render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		const dialog = getDialog(container);

		fireEvent.click(screen.getByLabelText("Non"));
		fireEvent.click(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		);

		await waitFor(() => {
			expect(conceal).toHaveBeenCalledWith(MISSING_INFO_PANEL_ID);
		});
		// The disclosure listener only fires on the DSFR conceal event.
		expect(disclose).not.toHaveBeenCalled();
		dialog.dispatchEvent(new Event("dsfr.conceal"));
		expect(disclose).toHaveBeenCalledWith(DECLARATION_PROCESS_PANEL_ID);
	});

	it("does not disclose anything on conceal when the process panel is absent", async () => {
		const { conceal, disclose } = stubDsfrModal();

		const { container } = render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		const dialog = getDialog(container);

		fireEvent.click(screen.getByLabelText("Non"));
		fireEvent.click(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		);

		await waitFor(() => {
			expect(conceal).toHaveBeenCalledWith(MISSING_INFO_PANEL_ID);
		});
		dialog.dispatchEvent(new Event("dsfr.conceal"));
		expect(disclose).not.toHaveBeenCalled();
	});

	it("discloses the representation process panel when opened from the representation entry", async () => {
		const { conceal, disclose } = stubDsfrModal();
		appendPanel(REPRESENTATION_PROCESS_PANEL_ID);
		appendPanel(DECLARATION_PROCESS_PANEL_ID);
		const opener = appendOpener("representation");

		const { container } = render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		const dialog = getDialog(container);

		opener.click();
		fireEvent.click(screen.getByLabelText("Non"));
		fireEvent.click(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		);

		await waitFor(() => {
			expect(conceal).toHaveBeenCalledWith(MISSING_INFO_PANEL_ID);
		});
		expect(disclose).not.toHaveBeenCalled();
		dialog.dispatchEvent(new Event("dsfr.conceal"));

		expect(disclose).toHaveBeenCalledWith(REPRESENTATION_PROCESS_PANEL_ID);
		expect(disclose).not.toHaveBeenCalledWith(DECLARATION_PROCESS_PANEL_ID);
	});

	it("does not disclose anything on conceal when the representation panel is absent", async () => {
		const { conceal, disclose } = stubDsfrModal();
		const opener = appendOpener("representation");

		const { container } = render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		const dialog = getDialog(container);

		opener.click();
		fireEvent.click(screen.getByLabelText("Non"));
		fireEvent.click(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		);

		await waitFor(() => {
			expect(conceal).toHaveBeenCalledWith(MISSING_INFO_PANEL_ID);
		});
		dialog.dispatchEvent(new Event("dsfr.conceal"));
		expect(disclose).not.toHaveBeenCalled();
	});

	it("targets the declaration process panel again when reopened from the remuneration entry", async () => {
		const { conceal, disclose } = stubDsfrModal();
		appendPanel(REPRESENTATION_PROCESS_PANEL_ID);
		appendPanel(DECLARATION_PROCESS_PANEL_ID);
		const representationOpener = appendOpener("representation");
		const remunerationOpener = appendOpener("remuneration");

		const { container } = render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		const dialog = getDialog(container);

		representationOpener.click();
		remunerationOpener.click();
		fireEvent.click(screen.getByLabelText("Non"));
		fireEvent.click(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		);

		await waitFor(() => {
			expect(conceal).toHaveBeenCalledWith(MISSING_INFO_PANEL_ID);
		});
		dialog.dispatchEvent(new Event("dsfr.conceal"));

		expect(disclose).toHaveBeenCalledWith(DECLARATION_PROCESS_PANEL_ID);
		expect(disclose).not.toHaveBeenCalledWith(REPRESENTATION_PROCESS_PANEL_ID);
	});
});
