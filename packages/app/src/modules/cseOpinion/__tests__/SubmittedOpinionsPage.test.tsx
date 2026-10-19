import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	formatSubmittedOpinionDate,
	SubmittedOpinionsPage,
} from "../SubmittedOpinionsPage";

const baseProps = {
	company: {
		name: "Entreprise exemple",
		siren: "123456789",
		address: "1 rue Exemple",
		countryCode: null,
		countryLabel: "FRANCE",
		departmentLabel: "Paris",
		gipWorkforce: 150,
		nafCode: "6201Z",
		nafLabel: "Programmation informatique",
		hasCse: true,
	},
	declarationYear: 2026,
	declarantFirstName: "Camille",
	declarantLastName: "Martin",
	declarantEmail: "camille@example.test",
	declarantPhone: "0102030405",
	submittedAt: new Date("2026-10-18T10:00:00Z"),
	secondDeclReferencePeriodStart: "2026-01-01",
	secondDeclReferencePeriodEnd: "2026-06-30",
	hasSubmittedSecondDeclaration: true,
	hasSubmittedJointEvaluation: true,
	opinions: [
		{
			declarationNumber: 1,
			type: "accuracy",
			gapConsulted: null,
			opinion: "favorable",
			opinionDate: "2026-10-17",
		},
		{
			declarationNumber: 2,
			type: "accuracy",
			gapConsulted: null,
			opinion: "unfavorable",
			opinionDate: "2026-10-18",
		},
	],
	associations: [
		{
			declarationNumber: 1,
			type: "accuracy",
			fileId: "file-1",
			fileName: "avis.pdf",
			uploadedAt: new Date("2026-10-18T09:00:00Z"),
		},
		{
			declarationNumber: 2,
			type: "accuracy",
			fileId: "file-1",
			fileName: "avis.pdf",
			uploadedAt: new Date("2026-10-18T09:00:00Z"),
		},
	],
};

describe("SubmittedOpinionsPage", () => {
	it("shows both declarations, declarant information, and one file associated with both opinions", () => {
		render(<SubmittedOpinionsPage {...baseProps} />);

		expect(
			screen.getByRole("heading", {
				name: "Avis du CSE pour la déclaration des indicateurs de rémunération 2026",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText("Les avis ont été transmis le 18/10/2026"),
		).toBeInTheDocument();
		expect(screen.getByText("Camille Martin")).toBeInTheDocument();
		expect(
			screen.getByText("6201Z — Programmation informatique"),
		).toBeInTheDocument();
		expect(screen.getByText("01/01/2026 - 30/06/2026")).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: "Consulter le rapport de l’évaluation conjointe",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Première déclaration" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Deuxième déclaration" }),
		).toBeInTheDocument();
		const fileRow = screen.getByRole("row", { name: /avis\.pdf/ });
		expect(
			within(fileRow).getAllByRole("img", { name: "Avis associé" }),
		).toHaveLength(2);
		expect(screen.getAllByRole("link", { name: /avis\.pdf/ })).toHaveLength(2);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
		expect(screen.getAllByRole("link", { name: "Télécharger" })).toHaveLength(
			1,
		);
	});

	it("does not show a second declaration when none was transmitted", () => {
		render(
			<SubmittedOpinionsPage
				{...baseProps}
				associations={baseProps.associations.slice(0, 1)}
				hasSubmittedJointEvaluation={false}
				hasSubmittedSecondDeclaration={false}
				opinions={baseProps.opinions.slice(0, 1)}
			/>,
		);
		expect(
			screen.queryByRole("heading", { name: "Deuxième déclaration" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", {
				name: "Consulter le rapport de l’évaluation conjointe",
			}),
		).not.toBeInTheDocument();
	});

	it("hides the CSE company field below the workforce threshold", () => {
		render(
			<SubmittedOpinionsPage
				{...baseProps}
				company={{ ...baseProps.company, gipWorkforce: 99 }}
			/>,
		);
		expect(screen.queryByText("Existence d’un CSE")).not.toBeInTheDocument();
	});

	it("formats the date of an opinion independently from the submission date", () => {
		expect(formatSubmittedOpinionDate("2026-10-17")).toBe("17/10/2026");
	});
});
