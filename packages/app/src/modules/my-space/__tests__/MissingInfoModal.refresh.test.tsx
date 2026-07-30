import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { MissingInfoModal } from "../MissingInfoModal";

describe("MissingInfoModal — refreshes the RSC props after saving (#4056)", () => {
	beforeEach(() => {
		mockRefresh.mockClear();
		updateHasCseAsync.mockClear();
		updatePhoneAsync.mockClear();
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
		const disclose = vi.fn();
		const conceal = vi.fn();
		(
			window as unknown as {
				dsfr: () => { modal: { conceal: () => void; disclose: () => void } };
			}
		).dsfr = () => ({ modal: { conceal, disclose } });

		const panel = document.createElement("div");
		panel.id = "declaration-process-panel";
		document.body.appendChild(panel);

		try {
			const { container } = render(
				<MissingInfoModal
					cseApplicable={true}
					hasCse={null}
					siren="532847196"
					userPhone="0122334455"
				/>,
			);
			const dialog = container.querySelector(
				"#missing-info-modal",
			) as HTMLDialogElement;

			fireEvent.click(screen.getByLabelText("Non"));
			fireEvent.click(
				screen.getByRole("button", { name: "Enregistrer", hidden: true }),
			);

			await waitFor(() => {
				expect(conceal).toHaveBeenCalled();
			});
			// The disclosure listener only fires on the DSFR conceal event.
			expect(disclose).not.toHaveBeenCalled();
			dialog.dispatchEvent(new Event("dsfr.conceal"));
			expect(disclose).toHaveBeenCalled();
		} finally {
			document.body.removeChild(panel);
			delete (window as unknown as { dsfr?: unknown }).dsfr;
		}
	});

	it("does not disclose anything on conceal when the process panel is absent", async () => {
		const disclose = vi.fn();
		const conceal = vi.fn();
		(
			window as unknown as {
				dsfr: () => { modal: { conceal: () => void; disclose: () => void } };
			}
		).dsfr = () => ({ modal: { conceal, disclose } });

		try {
			const { container } = render(
				<MissingInfoModal
					cseApplicable={true}
					hasCse={null}
					siren="532847196"
					userPhone="0122334455"
				/>,
			);
			const dialog = container.querySelector(
				"#missing-info-modal",
			) as HTMLDialogElement;

			fireEvent.click(screen.getByLabelText("Non"));
			fireEvent.click(
				screen.getByRole("button", { name: "Enregistrer", hidden: true }),
			);

			await waitFor(() => {
				expect(conceal).toHaveBeenCalled();
			});
			dialog.dispatchEvent(new Event("dsfr.conceal"));
			expect(disclose).not.toHaveBeenCalled();
		} finally {
			delete (window as unknown as { dsfr?: unknown }).dsfr;
		}
	});

	it("redirects to declaration-remuneration when opened from the representation entry", async () => {
		const originalLocation = window.location;
		const hrefSetter = vi.fn();
		Object.defineProperty(window, "location", {
			configurable: true,
			value: {
				...originalLocation,
				set href(value: string) {
					hrefSetter(value);
				},
			},
		});

		try {
			render(
				<MissingInfoModal
					cseApplicable={true}
					hasCse={null}
					siren="532847196"
					userPhone="0122334455"
				/>,
			);

			const opener = document.createElement("button");
			opener.setAttribute("aria-controls", "missing-info-modal");
			opener.dataset.declarationType = "representation";
			document.body.appendChild(opener);
			opener.click();

			fireEvent.click(screen.getByLabelText("Non"));
			fireEvent.click(
				screen.getByRole("button", { name: "Enregistrer", hidden: true }),
			);

			await waitFor(() => {
				expect(hrefSetter).toHaveBeenCalledWith(
					"/declaration-remuneration?siren=532847196",
				);
			});
			document.body.removeChild(opener);
		} finally {
			Object.defineProperty(window, "location", {
				configurable: true,
				value: originalLocation,
			});
		}
	});
});
