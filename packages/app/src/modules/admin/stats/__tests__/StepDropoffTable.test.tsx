import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DROPOFF_RATE_ALERT_THRESHOLD } from "~/modules/domain";
import { StepDropoffTable } from "../StepDropoffTable";
import type { StepDropoffRow } from "../types";

function buildWizardRow(
	overrides: Partial<StepDropoffRow> = {},
): StepDropoffRow {
	return {
		key: "1",
		phase: "wizard",
		step: 1,
		label: "Effectifs",
		total: 10,
		abandoned: 2,
		dropoffRate: 20,
		...overrides,
	};
}

function buildPostSubmitRow(
	overrides: Partial<StepDropoffRow> = {},
): StepDropoffRow {
	return {
		key: "awaiting_compliance_path_choice",
		phase: "post_submit",
		step: null,
		label: "Choix parcours conformité",
		total: 30,
		abandoned: 9,
		dropoffRate: 30,
		...overrides,
	};
}

describe("StepDropoffTable", () => {
	it("renders nothing when given no rows", () => {
		const { container } = render(<StepDropoffTable rows={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders one row per step with the expected columns", () => {
		render(
			<StepDropoffTable
				rows={[
					buildWizardRow({
						key: "0",
						step: 0,
						label: "Introduction",
						total: 100,
						abandoned: 5,
						dropoffRate: 5,
					}),
					buildWizardRow({
						key: "1",
						step: 1,
						label: "Effectifs",
						total: 80,
						abandoned: 20,
						dropoffRate: 25,
					}),
				]}
			/>,
		);

		const headers = screen
			.getAllByRole("columnheader")
			.map((el) => el.textContent);
		expect(headers).toEqual([
			"Phase",
			"Taux d'abandon (%)",
			"Abandonnées",
			"Total déclarations entrées dans la phase",
			"Au-dessus du seuil de 15 %",
		]);

		const introRowheader = screen.getByRole("rowheader", {
			name: "Introduction",
		});
		expect(introRowheader).toBeInTheDocument();
	});

	it("groups wizard and post-submit rows under two distinct rowgroup headers", () => {
		render(
			<StepDropoffTable
				rows={[
					buildWizardRow({
						key: "0",
						step: 0,
						label: "Introduction",
						total: 100,
						abandoned: 5,
						dropoffRate: 5,
					}),
					buildPostSubmitRow(),
				]}
			/>,
		);

		expect(
			screen.getByRole("rowheader", {
				name: /Parcours initial \(wizard A–F\)/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", { name: /Démarche post-transmission/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", { name: "Choix parcours conformité" }),
		).toBeInTheDocument();
	});

	it("formats numeric values with French decimal separator (1 decimal for %)", () => {
		render(
			<StepDropoffTable
				rows={[
					buildWizardRow({ dropoffRate: 16.7, abandoned: 1234, total: 5000 }),
				]}
			/>,
		);

		const cells = screen.getAllByRole("cell").map((el) => el.textContent);
		expect(cells).toContain("16,7");
		expect(
			cells.some((value) => value?.includes("1") && value?.includes("234")),
		).toBe(true);
	});

	it("formats a rate of 0 % as '0,0'", () => {
		render(
			<StepDropoffTable
				rows={[
					buildWizardRow({
						key: "5",
						step: 5,
						label: "Écart par catégorie d'emplois",
						total: 0,
						abandoned: 0,
						dropoffRate: 0,
					}),
				]}
			/>,
		);

		const cells = screen.getAllByRole("cell").map((el) => el.textContent);
		expect(cells).toContain("0,0");
	});

	it("renders all 12 rows when given a full wizard + post-submit dataset", () => {
		const rows: StepDropoffRow[] = [
			...[0, 1, 2, 3, 4, 5].map((step) =>
				buildWizardRow({
					key: String(step),
					step,
					label: `Étape ${step}`,
					total: 10,
					abandoned: 1,
					dropoffRate: 10,
				}),
			),
			buildPostSubmitRow({
				key: "awaiting_compliance_path_choice",
				label: "Choix parcours conformité",
			}),
			buildPostSubmitRow({
				key: "corrective_actions_chosen",
				label: "Seconde déclaration (corrective)",
			}),
			buildPostSubmitRow({
				key: "joint_evaluation_chosen",
				label: "Évaluation conjointe",
			}),
			buildPostSubmitRow({
				key: "awaiting_revision_choice",
				label: "Choix de révision",
			}),
			buildPostSubmitRow({
				key: "revised_joint_evaluation_chosen",
				label: "Évaluation conjointe (révision)",
			}),
			buildPostSubmitRow({
				key: "awaiting_cse_opinion",
				label: "Avis CSE",
			}),
		];

		render(<StepDropoffTable rows={rows} />);

		expect(
			screen.getByRole("rowheader", { name: "Avis CSE" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", {
				name: "Évaluation conjointe (révision)",
			}),
		).toBeInTheDocument();
		const rowheaderTexts = screen
			.getAllByRole("rowheader")
			.map((el) => el.textContent);
		const dataRowheaders = rowheaderTexts.filter(
			(text) =>
				text !== "Parcours initial (wizard A–F)" &&
				text !== "Démarche post-transmission",
		);
		expect(dataRowheaders).toHaveLength(12);
	});

	it("flags in a dedicated column, without relying on colour, the phases above the alert threshold", () => {
		render(
			<StepDropoffTable
				rows={[
					buildWizardRow({
						key: "0",
						step: 0,
						label: "Sous le seuil",
						dropoffRate: DROPOFF_RATE_ALERT_THRESHOLD - 0.1,
					}),
					buildWizardRow({
						key: "1",
						step: 1,
						label: "Au seuil",
						dropoffRate: DROPOFF_RATE_ALERT_THRESHOLD,
					}),
					buildPostSubmitRow({
						label: "Au-dessus du seuil",
						dropoffRate: DROPOFF_RATE_ALERT_THRESHOLD + 0.1,
					}),
				]}
			/>,
		);

		const lastCellOf = (label: string) =>
			screen
				.getByRole("rowheader", { name: label })
				.closest("tr")
				?.querySelector("td:last-child");

		expect(lastCellOf("Sous le seuil")).toHaveTextContent(/^Non$/);
		expect(lastCellOf("Au seuil")).toHaveTextContent(/^Non$/);
		const alertCell = lastCellOf("Au-dessus du seuil");
		expect(alertCell).toHaveTextContent("Oui");
		expect(alertCell?.querySelector('[aria-hidden="true"]')).toHaveTextContent(
			"▲",
		);
	});

	it("spans the phase group headers across every column, threshold column included", () => {
		render(<StepDropoffTable rows={[buildWizardRow()]} />);
		expect(
			screen.getByRole("rowheader", { name: "Parcours initial (wizard A–F)" }),
		).toHaveAttribute("colspan", "5");
	});
});
