import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { formatLongDate } from "~/modules/domain";
import {
	JointEvaluationAfterReport,
	JointEvaluationExistingReport,
	JointEvaluationHeading,
	JointEvaluationReportUpload,
	JointEvaluationTodo,
} from "../JointEvaluationReportBlocks";

const INPUT_ID = "report-upload";

function renderUpload(
	overrides: Partial<Parameters<typeof JointEvaluationReportUpload>[0]> = {},
) {
	return render(
		<JointEvaluationReportUpload
			disabled={false}
			error={null}
			hasMissingFile={false}
			inputId={INPUT_ID}
			onFilesChange={vi.fn()}
			selectedFiles={[]}
			{...overrides}
		/>,
	);
}

describe("JointEvaluationHeading", () => {
	it("renders the given section title with the external learn-more link", () => {
		render(<JointEvaluationHeading title="Évaluation conjointe" />);

		expect(
			screen.getByRole("heading", { level: 2, name: "Évaluation conjointe" }),
		).toBeInTheDocument();
		const link = screen.getByRole("link", {
			name: /En savoir plus sur l'évaluation conjointe des rémunérations/,
		});
		expect(link).toHaveAttribute(
			"href",
			"https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle",
		);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});
});

describe("JointEvaluationExistingReport", () => {
	const file = {
		id: "8f14e45f-ea4c-4f0b-9c1d-7a2b3c4d5e6f",
		fileName: "rapport.pdf",
		uploadedAt: new Date("2026-06-20T09:30:00"),
	};

	it("links the stored report in a new tab and dates its deposit", () => {
		render(<JointEvaluationExistingReport file={file} />);

		expect(screen.getByText("Rapport déjà déposé")).toBeInTheDocument();
		const link = screen.getByRole("link", { name: /rapport\.pdf/ });
		expect(link).toHaveAttribute("href", `/api/v1/files/${file.id}`);
		expect(link).toHaveAttribute("title", "Visualiser rapport.pdf");
		expect(link).toHaveAttribute("target", "_blank");
		expect(
			screen.getByText(`Déposé le ${formatLongDate(file.uploadedAt)}`),
		).toHaveClass("fr-text-mention--grey");
	});
});

describe("JointEvaluationReportUpload", () => {
	it("labels the pdf file input with its size and format hint", () => {
		renderUpload();

		const input = screen.getByLabelText(
			/Veuillez déposer le rapport de l'évaluation conjointe\./,
		);
		expect(input).toHaveAttribute("id", INPUT_ID);
		expect(input).toHaveAttribute("accept", ".pdf");
		expect(
			screen.getByText("Taille maximale : 10 Mo. Format supporté : pdf."),
		).toHaveClass("fr-hint-text");
	});

	it("renders the given block between the label and the drop zone", () => {
		renderUpload({ beforeDropzone: <p>Échéance du rapport</p> });

		const label = screen.getByText(
			/Veuillez déposer le rapport de l'évaluation conjointe\./,
		);
		const block = screen.getByText("Échéance du rapport");
		const dropzone = screen.getByRole("button", {
			name: /Sélectionner un fichier/,
		});
		expect(
			label.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(
			block.compareDocumentPosition(dropzone) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("disables the file selection when asked", () => {
		renderUpload({ disabled: true });

		expect(
			screen.getByRole("button", { name: /Sélectionner un fichier/ }),
		).toBeDisabled();
	});

	it("shows the upload error", () => {
		renderUpload({ error: "Fichier rejeté par l'antivirus." });

		expect(
			screen.getByText("Fichier rejeté par l'antivirus."),
		).toBeInTheDocument();
	});

	it("announces a missing report with a titled error alert", () => {
		renderUpload({ hasMissingFile: true });

		const title = screen.getByText(
			"Le rapport de l'évaluation conjointe est manquant",
		);
		expect(title).toHaveClass("fr-alert__title");
		expect(title.closest(".fr-alert--error")).toHaveAttribute("role", "alert");
	});

	it("renders no missing-report alert while a report is not yet required", () => {
		renderUpload();

		expect(
			screen.queryByText("Le rapport de l'évaluation conjointe est manquant"),
		).not.toBeInTheDocument();
	});
});

describe("JointEvaluationTodo", () => {
	it("titles the to-do box with the given title and lists the two steps", () => {
		render(<JointEvaluationTodo title="Ce que vous devez faire" />);

		expect(
			screen.getByRole("heading", {
				level: 3,
				name: "Ce que vous devez faire",
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
});

describe("JointEvaluationAfterReport", () => {
	it("describes the steps after the report with the TéléAccords link", () => {
		render(<JointEvaluationAfterReport />);

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
		expect(
			screen.getByText(
				/L'accord collectif ou le plan d'action doit être déposé sur/,
			),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /TéléAccords/ })).toHaveAttribute(
			"href",
			"https://www.teleaccord.travail.gouv.fr",
		);
	});
});
