import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JointEvaluationRecapData } from "../buildJointEvaluationRecapData";

const mocks = vi.hoisted(() => ({
	ensurePdfFontsRegistered: vi.fn(),
}));

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	return {
		Document: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", { "data-testid": "pdf-document" }, children),
		Page: ({ children, size }: { children: React.ReactNode; size: string }) =>
			React.createElement(
				"section",
				{ "data-size": size, "data-testid": "pdf-page" },
				children,
			),
		Text: ({ children }: { children: React.ReactNode }) =>
			React.createElement("span", null, children),
		View: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children),
		Image: () => React.createElement("div", { "data-testid": "pdf-image" }),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

vi.mock("../pdfFonts", () => ({
	PDF_FONT_FAMILY: "Marianne",
	ensurePdfFontsRegistered: mocks.ensurePdfFontsRegistered,
}));

import { JointEvaluationPdfDocument } from "../JointEvaluationPdfDocument";

const DATA: JointEvaluationRecapData = {
	year: 2027,
	transmittedAt: "10/12/2027",
	referencePeriod: "01/01/2026 - 31/12/2026",
	declarant: {
		name: "Marie Dupont",
		email: "email@example.fr",
		phone: "06 01 02 03 04",
	},
	company: {
		name: "Société Démo",
		siren: "123 456 789",
		location: { label: "Adresse", value: "12 rue des Innovateurs, Paris" },
		naf: "62.02A - Conseil en systèmes et logiciels informatiques",
		workforceLabel: "Effectif annuel moyen en 2026",
		workforceDisplay: "2 256",
		cseDisplay: "Oui",
	},
	file: {
		id: "file-1",
		name: "rapport-evaluation.pdf",
		detail: "PDF – 17,96 Ko · déposé le 17 août 2027",
	},
};

function renderDocument(data: JointEvaluationRecapData = DATA) {
	return render(<JointEvaluationPdfDocument data={data} />);
}

describe("JointEvaluationPdfDocument", () => {
	beforeEach(() => {
		mocks.ensurePdfFontsRegistered.mockClear();
	});

	it("titles the recap and dates its transmission with the maquette wording", () => {
		renderDocument();

		expect(
			screen.getByText(
				"Récapitulatif : Évaluation conjointe des rémunérations 2027",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("L’évaluation conjointe a été transmise le 10/12/2027."),
		).toBeInTheDocument();
		expect(mocks.ensurePdfFontsRegistered).toHaveBeenCalledTimes(1);
	});

	it("lays out the information banner and its four sections in maquette order", () => {
		const { container } = renderDocument();
		const text = container.textContent ?? "";
		const order = [
			"Informations",
			"Déclarant",
			"Entreprise",
			"Calcul",
			"Évaluation conjointe des rémunérations",
		].map((heading) =>
			text.indexOf(
				heading,
				text.indexOf("L’évaluation conjointe a été transmise"),
			),
		);

		expect(order.every((index) => index >= 0)).toBe(true);
		expect([...order].sort((a, b) => a - b)).toEqual(order);
	});

	it("shows the declarant, the company and the reference period", () => {
		renderDocument();

		for (const value of [
			"Marie Dupont",
			"email@example.fr",
			"06 01 02 03 04",
			"Numéro de téléphone",
			"Société Démo",
			"12 rue des Innovateurs, Paris",
			"62.02A - Conseil en systèmes et logiciels informatiques",
			"Effectif annuel moyen en 2026",
			"2 256",
			"Existence d'un CSE",
			"01/01/2026 - 31/12/2026",
		]) {
			expect(screen.getByText(value)).toBeInTheDocument();
		}
	});

	it("names the deposited file as plain text, with its format, size and deposit date", () => {
		renderDocument();

		expect(screen.getByText("Fichiers déposés")).toBeInTheDocument();
		const fileName = screen.getByText(/rapport-evaluation\.pdf/);
		expect(fileName.closest("a")).toBeNull();
		expect(
			screen.getByText(/PDF – 17,96 Ko · déposé le 17 août 2027/),
		).toBeInTheDocument();
	});

	it("leaves out the CSE row and the location row when they do not apply", () => {
		renderDocument({
			...DATA,
			company: { ...DATA.company, cseDisplay: null, location: null },
		});

		expect(screen.queryByText("Existence d'un CSE")).not.toBeInTheDocument();
		expect(screen.queryByText("Adresse")).not.toBeInTheDocument();
	});

	it("repeats the year, the formatted siren and the transmission date in the footer", () => {
		renderDocument();

		expect(
			screen.getByText(
				"Évaluation conjointe des rémunérations 2027 - SIREN 123 456 789 - transmise le 10/12/2027",
			),
		).toBeInTheDocument();
		expect(screen.getByTestId("pdf-page")).toHaveAttribute("data-size", "A4");
	});
});
