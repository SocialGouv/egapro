import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LockProvider } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { formatLongDate } from "~/modules/domain";
import { JointEvaluationForm } from "../JointEvaluationForm";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () =>
		"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
}));

vi.mock("~/modules/shared/uploadFile", () => ({
	uploadFile: vi.fn(),
}));

const submitJointEvaluationMock = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			submitJointEvaluation: {
				useMutation: () => ({
					mutate: (
						_input: undefined,
						opts?: { onSettled?: () => void; onSuccess?: () => void },
					) => {
						submitJointEvaluationMock();
						opts?.onSuccess?.();
						opts?.onSettled?.();
					},
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

const { uploadFile: uploadFileMock } = (await import(
	"~/modules/shared/uploadFile"
)) as unknown as { uploadFile: ReturnType<typeof vi.fn> };

const defaultProps = {
	cseOpinionRequired: false,
	declarationSiren: "123456789",
	declarationYear: 2026,
	existingFile: null,
	jointEvaluationDeadline: new Date("2026-08-01T00:00:00Z"),
};

describe("JointEvaluationForm", () => {
	beforeEach(() => {
		uploadFileMock.mockReset();
		// jsdom doesn't implement <dialog>; stub showModal/close so the dialog
		// actually toggles its `open` attribute and its contents become visible
		// to Testing Library queries.
		HTMLDialogElement.prototype.showModal = function showModal() {
			this.setAttribute("open", "");
		};
		HTMLDialogElement.prototype.close = function close() {
			this.removeAttribute("open");
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renders the page title and section heading", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(
			screen.getByRole("heading", {
				name: /parcours de mise en conformité/i,
				level: 1,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				name: "Évaluation conjointe des rémunérations",
				level: 2,
			}),
		).toBeInTheDocument();
	});

	it("names the read-only fieldset with a screen-reader-only legend (RGAA 11.6/11.7)", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(
			screen.getByRole("group", {
				name: "Évaluation conjointe des rémunérations",
			}),
		).toBeInTheDocument();
	});

	it("renders the deadline callout with the current year", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(
			screen.getByText(
				"Échéance pour transmettre le rapport de l'évaluation conjointe",
			),
		).toBeInTheDocument();
		expect(screen.getByText(/août 2026/i)).toBeInTheDocument();
		expect(
			screen.queryByText(/Déclaration effectuée le/),
		).not.toBeInTheDocument();
	});

	it("shows a titled error alert when submitting without a file", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		const submitButton = screen.getByRole("button", { name: /transmettre/i });
		fireEvent.click(submitButton);

		const title = screen.getByText(
			/le rapport de l'évaluation conjointe est manquant/i,
		);
		expect(title).toHaveClass("fr-alert__title");
		expect(title.closest(".fr-alert--error")).toBeInTheDocument();
		expect(
			screen.getByText(/importez le rapport de l'évaluation conjointe/i),
		).toBeInTheDocument();
	});

	it("renders the reminder box above the deposit label", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(
			screen.getByRole("heading", {
				level: 3,
				name: "Rappel : Ce que vous devez faire dans un délai de 2 mois",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Réaliser l'analyse conjointe et définir des actions correctrices",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Transmettre le rapport dans la zone de dépôt prévue sur cette page",
			),
		).toBeInTheDocument();
	});

	it("renders the after-report box below the deposit zone, with the TéléAccords link", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(
			screen.getByRole("heading", {
				level: 3,
				name: "Après élaboration du rapport",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText("Négocier un accord collectif"),
		).toBeInTheDocument();
		expect(
			screen.getByText("À défaut, mettre en place un plan d'action"),
		).toBeInTheDocument();
		const link = screen.getByRole("link", { name: /TéléAccords/ });
		expect(link).toHaveAttribute(
			"href",
			"https://accords-depot.travail.gouv.fr/accueil",
		);
		expect(link).toHaveAttribute("target", "_blank");
	});

	it("does not render the removed wording", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(
			screen.queryByText(
				"Dépôt du rapport de l'évaluation conjointe des rémunérations",
			),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				/Vous devez déposer le rapport de l'évaluation conjointe, ci-dessous\./,
			),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(/Déclaration effectuée le/),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("Après dépôt du rapport"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(/Veuillez importer\/déposer/),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				(text) => text === "Ce que vous devez faire dans un délai de 2 mois",
			),
		).not.toBeInTheDocument();
	});

	it("orders the reminder, deposit label, deadline, upload zone and after-report boxes", () => {
		const { container } = render(<JointEvaluationForm {...defaultProps} />);

		const texts = Array.from(
			container.querySelectorAll("h2, h3, label, input[type='file']"),
		).map((el) => (el.tagName === "INPUT" ? "file-input" : el.textContent));

		const reminderIndex = texts.findIndex((t) => t?.startsWith("Rappel"));
		const labelIndex = texts.findIndex((t) =>
			t?.startsWith("Veuillez déposer"),
		);
		const fileInputIndex = texts.indexOf("file-input");
		const afterReportIndex = texts.indexOf("Après élaboration du rapport");

		expect(reminderIndex).toBeGreaterThanOrEqual(0);
		expect(labelIndex).toBeGreaterThan(reminderIndex);
		expect(fileInputIndex).toBeGreaterThan(labelIndex);
		expect(afterReportIndex).toBeGreaterThan(fileInputIndex);
	});

	it("labels the deposit field with the shortened wording", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(
			screen.getByLabelText(
				/Veuillez déposer le rapport de l'évaluation conjointe\./,
			),
		).toBeInTheDocument();
	});

	it("links the learn-more text with the corrected wording", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		expect(
			screen.getByRole("link", {
				name: /En savoir plus sur l'évaluation conjointe des rémunérations/,
			}),
		).toBeInTheDocument();
	});

	it("links back to the compliance path choice page", () => {
		render(<JointEvaluationForm {...defaultProps} />);

		const backLink = screen.getByRole("link", { name: /précédent/i });
		expect(backLink).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("opens modal after selecting a file and submitting", () => {
		const { container } = render(<JointEvaluationForm {...defaultProps} />);

		const input = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const file = new File(["pdf-content"], "rapport.pdf", {
			type: "application/pdf",
		});
		fireEvent.change(input, { target: { files: [file] } });

		fireEvent.click(screen.getByRole("button", { name: /transmettre/i }));

		expect(
			screen.queryByText(/le rapport de l'évaluation conjointe est manquant/i),
		).not.toBeInTheDocument();

		expect(
			container.querySelector("dialog#joint-evaluation-submit-modal"),
		).toBeInTheDocument();
	});

	it("renders the submit modal with correct labels", () => {
		const { container } = render(<JointEvaluationForm {...defaultProps} />);

		const dialog = container.querySelector(
			"dialog#joint-evaluation-submit-modal",
		);
		expect(dialog).toBeInTheDocument();
		expect(screen.getByText(/je certifie/i)).toBeInTheDocument();
	});

	it.each([
		[true, "/avis-cse"],
		[false, "/declaration-remuneration/parcours-conformite/confirmation"],
	])("uploads the file and redirects after confirmation when cseOpinionRequired=%s", async (cseOpinionRequired, expectedRedirect) => {
		const user = userEvent.setup();
		uploadFileMock.mockResolvedValue({
			ok: true,
			fileId: "file-1",
			fileName: "rapport.pdf",
		});

		const { container } = render(
			<JointEvaluationForm
				{...defaultProps}
				cseOpinionRequired={cseOpinionRequired}
			/>,
		);

		const input = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const file = new File(["pdf-content"], "rapport.pdf", {
			type: "application/pdf",
		});
		fireEvent.change(input, { target: { files: [file] } });

		fireEvent.click(screen.getByRole("button", { name: /transmettre/i }));

		await user.click(screen.getByRole("checkbox"));
		await user.click(screen.getByRole("button", { name: "Valider" }));

		await waitFor(() => {
			expect(uploadFileMock).toHaveBeenCalledWith(file, {
				flowType: "joint_evaluation",
			});
		});
		await waitFor(() => {
			expect(submitJointEvaluationMock).toHaveBeenCalledTimes(1);
		});
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith(expectedRedirect);
		});
	});

	describe("rapport déjà déposé (#4222)", () => {
		const existingFile = {
			id: "8f14e45f-ea4c-4f0b-9c1d-7a2b3c4d5e6f",
			fileName: "rapport-evaluation-conjointe.pdf",
			uploadedAt: new Date("2026-06-20T09:30:00"),
		};

		it("lists the deposited report with a new-tab link to the stored file", () => {
			render(
				<JointEvaluationForm {...defaultProps} existingFile={existingFile} />,
			);

			expect(screen.getByText("Rapport déjà déposé")).toBeInTheDocument();

			const link = screen.getByRole("link", {
				name: /rapport-evaluation-conjointe\.pdf/,
			});
			expect(link).toHaveAttribute(
				"href",
				"/api/v1/files/8f14e45f-ea4c-4f0b-9c1d-7a2b3c4d5e6f",
			);
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
			expect(
				within(link).getByText("(ouvre une nouvelle fenêtre)"),
			).toBeInTheDocument();
		});

		it("states the deposit date of the existing report", () => {
			render(
				<JointEvaluationForm {...defaultProps} existingFile={existingFile} />,
			);

			expect(
				screen.getByText(
					`Déposé le ${formatLongDate(existingFile.uploadedAt)}`,
				),
			).toHaveClass("fr-text-mention--grey");
		});

		it("keeps the upload zone available so the report can still be replaced", () => {
			const { container } = render(
				<JointEvaluationForm {...defaultProps} existingFile={existingFile} />,
			);

			expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /transmettre/i }),
			).toBeInTheDocument();
		});

		it("renders no deposited-report block when no file exists yet", () => {
			render(<JointEvaluationForm {...defaultProps} />);

			expect(screen.queryByText("Rapport déjà déposé")).not.toBeInTheDocument();
			expect(
				screen.queryByRole("link", {
					name: /rapport-evaluation-conjointe\.pdf/,
				}),
			).not.toBeInTheDocument();
		});
	});

	describe("admin impersonation", () => {
		afterEach(() => {
			vi.mocked(useSession).mockReset();
		});

		it("disables the upload and submit controls under the static provider when impersonating", () => {
			vi.mocked(useSession).mockReturnValue({
				data: {
					user: {
						id: "admin-1",
						impersonation: { siren: "123456789", name: "Acme" },
					},
					expires: "2099-01-01",
				},
				status: "authenticated",
			} as unknown as ReturnType<typeof useSession>);

			// The layout feeds `isReadOnly={false}` but impersonation must still
			// disable writes through the unified context. The fieldset itself
			// stays enabled so its content remains exposed to assistive
			// technologies; each control is disabled individually.
			const { container } = render(
				<LockProvider isReadOnly={false}>
					<JointEvaluationForm {...defaultProps} />
				</LockProvider>,
			);

			expect(container.querySelector("fieldset")).not.toBeDisabled();
			expect(
				screen.getByRole("button", { name: /Sélectionner un fichier/ }),
			).toBeDisabled();
			expect(
				screen.getByRole("button", { name: /transmettre/i }),
			).toBeDisabled();
		});
	});
});
