import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LockProvider } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { FormalNoticeForm } from "../FormalNoticeForm";

const { mockPush, submitMock, mutationOutcome } = vi.hoisted(() => ({
	mockPush: vi.fn(),
	submitMock: vi.fn(),
	mutationOutcome: { errorMessage: null as string | null },
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () => "/declaration-remuneration/mise-en-demeure",
}));

vi.mock("~/modules/shared/uploadFile", () => ({
	uploadFile: vi.fn(),
}));

vi.mock("~/trpc/react", async () => {
	const { useState } = await import("react");
	return {
		api: {
			formalNotice: {
				submit: {
					useMutation: () => {
						const [error, setError] = useState<{ message: string } | null>(
							null,
						);
						return {
							mutate: (
								_input: undefined,
								opts?: { onSuccess?: () => void; onError?: () => void },
							) => {
								submitMock();
								if (mutationOutcome.errorMessage) {
									setError({ message: mutationOutcome.errorMessage });
									opts?.onError?.();
									return;
								}
								opts?.onSuccess?.();
							},
							isPending: false,
							error,
						};
					},
				},
			},
		},
	};
});

const { uploadFile: uploadFileMock } = (await import(
	"~/modules/shared/uploadFile"
)) as unknown as { uploadFile: ReturnType<typeof vi.fn> };

const EXISTING_FILE = {
	id: "8f14e45f-ea4c-4f0b-9c1d-7a2b3c4d5e6f",
	fileName: "rapport-mise-en-demeure.pdf",
	uploadedAt: new Date("2027-06-20T09:30:00"),
};

function selectReport(container: HTMLElement) {
	const input = container.querySelector(
		'input[type="file"]',
	) as HTMLInputElement;
	const file = new File(["pdf-content"], "rapport.pdf", {
		type: "application/pdf",
	});
	fireEvent.change(input, { target: { files: [file] } });
	return file;
}

async function confirmSubmission() {
	const user = userEvent.setup();
	fireEvent.click(screen.getByRole("button", { name: /transmettre/i }));
	await user.click(screen.getByRole("checkbox"));
	await user.click(screen.getByRole("button", { name: "Valider" }));
}

describe("FormalNoticeForm", () => {
	beforeEach(() => {
		uploadFileMock.mockReset();
		mutationOutcome.errorMessage = null;
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

	it("renders the formal notice title and the joint evaluation section", () => {
		render(<FormalNoticeForm existingFile={null} />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "En cas de mise en demeure",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Évaluation conjointe des rémunérations",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: /En savoir plus sur l'évaluation conjointe des rémunérations/,
			}),
		).toHaveAttribute("target", "_blank");
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("states what must be deposited and where the compliance deadline is given", () => {
		render(<FormalNoticeForm existingFile={null} />);

		expect(
			screen.getByLabelText(
				/Veuillez déposer le rapport de l'évaluation conjointe\./,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Le délai de mise en conformité est indiqué dans la mise en demeure notifiée par la DREETS.",
			),
		).toHaveClass("fr-text--bold");
		expect(screen.queryByText("Échéance")).not.toBeInTheDocument();
	});

	it("labels the pdf upload zone", () => {
		render(<FormalNoticeForm existingFile={null} />);

		expect(
			screen.getByLabelText(
				/Veuillez déposer le rapport de l'évaluation conjointe\./,
			),
		).toHaveAttribute("id", "formal-notice-joint-evaluation-file-upload");
		expect(
			screen.getByText("Taille maximale : 10 Mo. Format supporté : pdf."),
		).toBeInTheDocument();
	});

	it("renders the guidance boxes without the two-month delay", () => {
		render(<FormalNoticeForm existingFile={null} />);

		expect(
			screen.getByRole("heading", {
				level: 3,
				name: "Ce que vous devez faire",
			}),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/dans un délai de 2 mois/),
		).not.toBeInTheDocument();
		expect(
			screen.getByText(
				"Réaliser l'analyse conjointe et définir des actions correctrices",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: "Après élaboration du rapport",
			}),
		).toBeInTheDocument();
	});

	it("lists the already-deposited report", () => {
		render(<FormalNoticeForm existingFile={EXISTING_FILE} />);

		expect(screen.getByText("Rapport déjà déposé")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /rapport-mise-en-demeure\.pdf/ }),
		).toHaveAttribute("href", `/api/v1/files/${EXISTING_FILE.id}`);
	});

	it("renders no deposited-report block when no report exists yet", () => {
		render(<FormalNoticeForm existingFile={null} />);

		expect(screen.queryByText("Rapport déjà déposé")).not.toBeInTheDocument();
	});

	it("links back to Mon espace", () => {
		render(<FormalNoticeForm existingFile={null} />);

		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/mon-espace",
		);
	});

	it("shows the missing-report alert when submitting without a file", () => {
		render(<FormalNoticeForm existingFile={null} />);

		fireEvent.click(screen.getByRole("button", { name: /transmettre/i }));

		expect(
			screen.getByText(/le rapport de l'évaluation conjointe est manquant/i),
		).toHaveClass("fr-alert__title");
		expect(submitMock).not.toHaveBeenCalled();
	});

	it("disables the upload and submit controls when the démarche is read-only", () => {
		render(
			<LockProvider isReadOnly>
				<FormalNoticeForm existingFile={null} />
			</LockProvider>,
		);

		expect(
			screen.getByRole("button", { name: /Sélectionner un fichier/ }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: /transmettre/i })).toBeDisabled();
	});

	it("uploads the report, transmits it and returns to Mon espace", async () => {
		uploadFileMock.mockResolvedValue({
			ok: true,
			fileId: "file-1",
			fileName: "rapport.pdf",
		});
		const { container } = render(<FormalNoticeForm existingFile={null} />);
		const file = selectReport(container);

		await confirmSubmission();

		await waitFor(() => {
			expect(uploadFileMock).toHaveBeenCalledWith(file, {
				flowType: "formal_notice_joint_evaluation",
			});
		});
		await waitFor(() => {
			expect(submitMock).toHaveBeenCalledTimes(1);
		});
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("/mon-espace");
		});
	});

	it("shows the transmission error and stays on the page when the submit fails", async () => {
		const message =
			"Le rapport de l'évaluation conjointe doit être déposé avant sa transmission.";
		mutationOutcome.errorMessage = message;
		uploadFileMock.mockResolvedValue({
			ok: true,
			fileId: "file-1",
			fileName: "rapport.pdf",
		});
		const { container } = render(<FormalNoticeForm existingFile={null} />);
		selectReport(container);

		await confirmSubmission();

		expect(await screen.findByText(message)).toBeInTheDocument();
		expect(submitMock).toHaveBeenCalledTimes(1);
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("does not transmit when the upload fails", async () => {
		uploadFileMock.mockResolvedValue({
			ok: false,
			reason: "server_error",
			error: "boom",
		});
		const { container } = render(<FormalNoticeForm existingFile={null} />);
		selectReport(container);

		await confirmSubmission();

		expect(
			await screen.findByText(
				"Erreur lors de l'upload du fichier. Merci de réessayer.",
			),
		).toBeInTheDocument();
		expect(submitMock).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});
});
