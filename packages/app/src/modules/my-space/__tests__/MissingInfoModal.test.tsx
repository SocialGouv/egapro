import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockImpersonatingSession } from "~/test/impersonationMock";

const mockedUseSession = vi.mocked(useSession);

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

describe("MissingInfoModal", () => {
	it("renders the modal with correct id and title", () => {
		const { container } = render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		const dialog = container.querySelector("#missing-info-modal");
		expect(dialog).toBeInTheDocument();
		expect(
			container.querySelector("#missing-info-modal-title"),
		).toHaveTextContent("Informations manquantes");
	});

	it("shows both phone and CSE description when both are missing", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.getByText(
				"Pour continuer, vous devez ajouter un numéro de téléphone à votre profil et nous indiquer si un CSE a été mis en place.",
			),
		).toBeInTheDocument();
	});

	it("shows phone-only description when only phone is missing", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={true}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.getByText(
				"Pour continuer, vous devez ajouter un numéro de téléphone à votre profil.",
			),
		).toBeInTheDocument();
	});

	it("shows CSE-only description when only CSE is missing", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.getByText(
				"Pour continuer, vous devez indiquer si un CSE a été mis en place dans votre entreprise.",
			),
		).toBeInTheDocument();
	});

	it("renders phone field when userPhone is null", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={true}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(screen.getByLabelText(/Numéro de téléphone/)).toBeInTheDocument();
	});

	it("does not render phone field when userPhone is provided", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.queryByLabelText(/Numéro de téléphone/),
		).not.toBeInTheDocument();
	});

	it("renders CSE radio buttons when hasCse is null and CSE is applicable", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		expect(screen.getByLabelText("Oui")).toBeInTheDocument();
		expect(screen.getByLabelText("Non")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Un CSE a-t-il été mis en place dans votre entreprise ?",
			),
		).toBeInTheDocument();
	});

	it("does not render CSE radio buttons when hasCse is provided", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={true}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.queryByText(
				"Un CSE a-t-il été mis en place dans votre entreprise ?",
			),
		).not.toBeInTheDocument();
	});

	it("hides CSE radios and limits the description to the phone when CSE is not applicable", () => {
		render(
			<MissingInfoModal
				cseApplicable={false}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.getByText(
				"Pour continuer, vous devez ajouter un numéro de téléphone à votre profil.",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByText(
				"Un CSE a-t-il été mis en place dans votre entreprise ?",
			),
		).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Oui")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Non")).not.toBeInTheDocument();
	});

	it("renders Enregistrer and Retour buttons", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		).toHaveTextContent("Enregistrer");
		expect(screen.getByText("Retour")).toBeInTheDocument();
	});

	it("renders the close button", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(screen.getByTitle("Fermer")).toBeInTheDocument();
	});

	it("Enregistrer button is not disabled when mutations are idle", () => {
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		).not.toBeDisabled();
	});

	it("shows the explicit CSE error when submitting without selecting a radio", async () => {
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
			const error = document.querySelector(
				"#missing-info-cse-error .fr-message--error",
			);
			expect(error).toHaveTextContent(
				"Veuillez renseigner si un CSE a été mis en place.",
			);
		});
	});

	it("parses the selected CSE radio to a boolean and clears the error on resubmit", async () => {
		updateHasCseAsync.mockClear();
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);
		const enregistrer = screen.getByRole("button", {
			name: "Enregistrer",
			hidden: true,
		});

		fireEvent.click(enregistrer);
		await waitFor(() => {
			expect(
				document.querySelector("#missing-info-cse-error .fr-message--error"),
			).toBeInTheDocument();
		});

		fireEvent.click(screen.getByLabelText("Non"));
		fireEvent.click(enregistrer);
		await waitFor(() => {
			expect(updateHasCseAsync).toHaveBeenCalledWith({
				siren: "532847196",
				hasCse: false,
			});
		});
		expect(
			document.querySelector("#missing-info-cse-error"),
		).not.toBeInTheDocument();
	});

	it("parses the Oui CSE radio to true on submit", async () => {
		updateHasCseAsync.mockClear();
		render(
			<MissingInfoModal
				cseApplicable={true}
				hasCse={null}
				siren="532847196"
				userPhone="0122334455"
			/>,
		);

		fireEvent.click(screen.getByLabelText("Oui"));
		fireEvent.click(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		);
		await waitFor(() => {
			expect(updateHasCseAsync).toHaveBeenCalledWith({
				siren: "532847196",
				hasCse: true,
			});
		});
	});

	describe("refreshes the RSC props after saving (#4056)", () => {
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
			// Simulate the DSFR JS runtime so getDsfrModal returns its modal API.
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

				// The opener type is captured from the click on the aria-controls trigger.
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

	it("clears the phone field when the dialog is reopened", async () => {
		const { container } = render(
			<MissingInfoModal
				cseApplicable={false}
				hasCse={null}
				siren="532847196"
				userPhone={null}
			/>,
		);
		const dialog = container.querySelector(
			"#missing-info-modal",
		) as HTMLDialogElement;
		const phone = screen.getByLabelText(
			/Numéro de téléphone/,
		) as HTMLInputElement;

		fireEvent.change(phone, { target: { value: "0612345678" } });
		expect(phone.value).not.toBe("");

		// The DSFR runtime toggles the `open` attribute; the MutationObserver in
		// useDsfrDialogOpen resets the form on each reopen.
		dialog.setAttribute("open", "");

		await waitFor(() => {
			expect(
				(screen.getByLabelText(/Numéro de téléphone/) as HTMLInputElement)
					.value,
			).toBe("");
		});
	});

	describe("admin impersonation", () => {
		afterEach(() => {
			mockedUseSession.mockReset();
		});

		it("does not render the modal when impersonating", () => {
			mockImpersonatingSession(mockedUseSession);

			const { container } = render(
				<MissingInfoModal
					cseApplicable={true}
					hasCse={null}
					siren="532847196"
					userPhone={null}
				/>,
			);
			expect(container.querySelector("#missing-info-modal")).toBeNull();
		});
	});
});
