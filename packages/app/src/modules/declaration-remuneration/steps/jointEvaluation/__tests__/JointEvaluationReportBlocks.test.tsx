import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { formatLongDate } from "~/modules/domain";
import {
	JointEvaluationDepositInstructions,
	JointEvaluationExistingReport,
	JointEvaluationGuidance,
	JointEvaluationHeading,
	JointEvaluationReportUpload,
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
			name: /En savoir plus sur évaluation conjointe des rémunérations/,
		});
		expect(link).toHaveAttribute(
			"href",
			"https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle",
		);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});
});

describe("JointEvaluationDepositInstructions", () => {
	it("asks for the report and points the agreement to TéléAccord", () => {
		render(<JointEvaluationDepositInstructions />);

		expect(
			screen.getByText(
				"déposer le rapport de l'évaluation conjointe, ci-dessous.",
			).tagName,
		).toBe("STRONG");
		expect(
			screen.getByText(/doit être déposé sur TéléAccord\./),
		).toBeInTheDocument();
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
			/Veuillez importer\/déposer le rapport de l'évaluation conjointe\./,
		);
		expect(input).toHaveAttribute("id", INPUT_ID);
		expect(input).toHaveAttribute("accept", ".pdf");
		expect(
			screen.getByText("Taille maximale : 10 Mo. Format supporté : pdf."),
		).toHaveClass("fr-hint-text");
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

describe("JointEvaluationGuidance", () => {
	it("titles the to-do box with the given title", () => {
		render(<JointEvaluationGuidance todoTitle="Ce que vous devez faire" />);

		expect(
			screen.getByRole("heading", {
				level: 3,
				name: "Ce que vous devez faire",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Élaboration du rapport")).toBeInTheDocument();
	});

	it("describes the steps after the deposit with the TéléAccord link", () => {
		render(<JointEvaluationGuidance todoTitle="Ce que vous devez faire" />);

		expect(
			screen.getByRole("heading", { level: 3, name: "Après dépôt du rapport" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /TéléAccord/ })).toHaveAttribute(
			"href",
			"https://www.teleaccord.travail.gouv.fr",
		);
	});
});
