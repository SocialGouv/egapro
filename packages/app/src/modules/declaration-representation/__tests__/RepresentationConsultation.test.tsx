import { render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { formatWorkforceForUser } from "~/modules/domain";
import { RepresentationConsultation } from "../RepresentationConsultation";
import type { RepresentationDraft } from "../types";

type ConsultationProps = ComponentProps<typeof RepresentationConsultation>;

const CAMPAIGN_YEAR = 2027;
const REFERENCE_YEAR = 2026;

const COMPANY = {
	name: "Société Démo",
	siren: "123456789",
	nafCode: "6201Z",
	nafLabel: "Programmation informatique",
	address: "1 rue Test, 75001 Paris",
	countryCode: null,
	countryLabel: null,
	departmentLabel: "Paris",
};

const DECLARANT = {
	firstName: "Jeanne",
	lastName: "Dupont",
	email: "jeanne.dupont@example.fr",
	phone: "0601020304",
};

const SUBMITTED_AT = new Date("2027-07-10T10:00:00.000Z");

const BASE_DRAFT: RepresentationDraft = {
	currentStep: 5,
	referencePeriodStart: "2026-01-01",
	referencePeriodEnd: "2026-12-31",
	executivesCount: "two_or_more",
	executiveWomenPercent: 35,
	executiveMenPercent: 65,
	hasManagementBody: true,
	memberWomenPercent: 25,
	memberMenPercent: 75,
	hasWebsite: false,
	publishDate: "2027-03-01",
	publishModalities: "Affichage dans les locaux et note de service.",
};

function renderPage(
	overrides: Partial<RepresentationDraft> = {},
	{
		company = COMPANY,
		declarant = DECLARANT,
	}: {
		company?: ConsultationProps["company"];
		declarant?: ConsultationProps["declarant"];
	} = {},
) {
	return render(
		<RepresentationConsultation
			campaignYear={CAMPAIGN_YEAR}
			company={company}
			declarant={declarant}
			draft={{ ...BASE_DRAFT, ...overrides }}
			referenceYear={REFERENCE_YEAR}
			submittedAt={SUBMITTED_AT}
			workforceEma={1200}
		/>,
	);
}

function definitionValue(term: string): string {
	const value = screen.getByText(term, { selector: "dt" }).nextElementSibling;
	return value?.textContent ?? "";
}

function gapColumn(title: string): HTMLElement {
	const heading = screen.getByRole("heading", { level: 3, name: title });
	const column = heading.parentElement;
	if (column === null) throw new Error(`Missing column for "${title}".`);
	return column;
}

describe("RepresentationConsultation — S1 nominal", () => {
	beforeEach(() => {
		renderPage();
	});

	it("titles the page with the campaign year and the transmission date", () => {
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: `Démarche des indicateurs de représentation ${CAMPAIGN_YEAR}`,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText("La déclaration a été transmise le 10/07/2027."),
		).toBeInTheDocument();
	});

	it("restitutes the declarant", () => {
		expect(definitionValue("Nom Prénom")).toBe("Jeanne Dupont");
		expect(definitionValue("Adresse email")).toBe(DECLARANT.email);
		expect(definitionValue("Numéro de téléphone")).toBe(DECLARANT.phone);
	});

	it("restitutes the company, its NAF and its workforce for the reference year", () => {
		expect(definitionValue("Raison sociale")).toBe(COMPANY.name);
		expect(definitionValue("SIREN")).toBe("123 456 789");
		expect(definitionValue("Adresse")).toBe(COMPANY.address);
		expect(definitionValue("Code NAF")).toBe(
			"6201Z — Programmation informatique",
		);
		expect(definitionValue(`Effectif annuel moyen en ${REFERENCE_YEAR}`)).toBe(
			formatWorkforceForUser(1200),
		);
	});

	it("restitutes the reference period", () => {
		expect(definitionValue("Période de référence")).toBe(
			"01/01/2026 - 31/12/2026",
		);
	});

	it("restitutes both computable gaps with their verdicts", () => {
		const executives = within(gapColumn("Cadres dirigeants"));
		expect(executives.getByText("35 %")).toBeInTheDocument();
		expect(executives.getByText("65 %")).toBeInTheDocument();
		expect(executives.getByText("Conforme")).toBeInTheDocument();

		const members = within(gapColumn("Membres des instances dirigeantes"));
		expect(members.getByText("25 %")).toBeInTheDocument();
		expect(members.getByText("75 %")).toBeInTheDocument();
		expect(members.getByText("Non conforme")).toBeInTheDocument();
	});

	it("restitutes an offline publication", () => {
		expect(
			screen.getByRole("heading", { level: 2, name: "Publication" }),
		).toBeInTheDocument();
		expect(definitionValue("Site Internet de publication")).toBe("Non");
		expect(definitionValue("Modalités de communication")).toBe(
			"Affichage dans les locaux et note de service.",
		);
	});

	it("offers the PDF download of the reference year", () => {
		const link = screen.getByRole("link", {
			name: "Télécharger la déclaration des indicateurs de représentation (PDF)",
		});
		expect(link).toHaveAttribute(
			"href",
			`/api/representation-pdf?year=${REFERENCE_YEAR}`,
		);
		expect(link).toHaveAttribute("download");
	});

	it("offers no edit action", () => {
		expect(screen.queryByText("Modifier")).not.toBeInTheDocument();
	});

	it("sends Retour, the breadcrumb and the bottom action back to Mon espace", () => {
		expect(screen.getByRole("link", { name: "Retour" })).toHaveAttribute(
			"href",
			"/mon-espace",
		);
		const monEspaceLinks = screen.getAllByRole("link", {
			name: "Mon espace",
		});
		expect(monEspaceLinks).toHaveLength(2);
		for (const link of monEspaceLinks) {
			expect(link).toHaveAttribute("href", "/mon-espace");
		}
	});
});

describe("RepresentationConsultation — S2 écart non calculable", () => {
	it("shows the single-executive reason and a not-computable badge, with no table", () => {
		renderPage({
			executivesCount: "one",
			executiveWomenPercent: undefined,
			executiveMenPercent: undefined,
		});

		const column = gapColumn("Cadres dirigeants");
		expect(column).toHaveTextContent("Un cadre dirigeant");
		expect(column).toHaveTextContent("Non calculable");
		expect(column.querySelector("table")).toBeNull();
	});
});

describe("RepresentationConsultation — S3 publication non requise", () => {
	it("hides the Publication section when neither gap is computable", () => {
		renderPage({
			executivesCount: "none",
			executiveWomenPercent: undefined,
			executiveMenPercent: undefined,
			hasManagementBody: false,
			memberWomenPercent: undefined,
			memberMenPercent: undefined,
		});

		expect(gapColumn("Cadres dirigeants")).toHaveTextContent(
			"Aucun cadre dirigeant",
		);
		expect(gapColumn("Membres des instances dirigeantes")).toHaveTextContent(
			"Aucune instance dirigeante",
		);
		expect(
			screen.queryByRole("heading", { name: "Publication" }),
		).not.toBeInTheDocument();
	});
});

describe("RepresentationConsultation — S4 publication sur site", () => {
	it("renders the publication URL as a new-tab link and hides the modalities row", () => {
		renderPage({
			hasWebsite: true,
			publishUrl: "https://exemple.fr/egalite-professionnelle",
			publishModalities: undefined,
		});

		const link = screen.getByRole("link", {
			name: /exemple\.fr\/egalite-professionnelle.*nouvelle fenêtre/i,
		});
		expect(link).toHaveAttribute(
			"href",
			"https://exemple.fr/egalite-professionnelle",
		);
		expect(link).toHaveAttribute("target", "_blank");
		expect(
			screen.queryByText("Modalités de communication", { selector: "dt" }),
		).not.toBeInTheDocument();
	});
});

describe("RepresentationConsultation — lignes sans valeur omises", () => {
	it("omits the declarant and company rows left empty", () => {
		renderPage(
			{},
			{
				company: {
					...COMPANY,
					nafCode: null,
					nafLabel: null,
					address: null,
					countryCode: null,
					countryLabel: null,
					departmentLabel: "Paris",
				},
				declarant: {
					firstName: null,
					lastName: null,
					email: null,
					phone: null,
				},
			},
		);

		expect(
			screen.queryByText("Nom Prénom", { selector: "dt" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("Adresse email", { selector: "dt" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("Numéro de téléphone", { selector: "dt" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("Adresse", { selector: "dt" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("Code NAF", { selector: "dt" }),
		).not.toBeInTheDocument();
		expect(definitionValue(`Effectif annuel moyen en ${REFERENCE_YEAR}`)).toBe(
			formatWorkforceForUser(1200),
		);
		expect(screen.getByText("Non renseigné")).toBeInTheDocument();
	});

	it("flags the declarant as not provided when no user is recorded on the declaration", () => {
		renderPage({}, { declarant: null });

		const declarantGroup = screen.getByRole("heading", {
			level: 3,
			name: "Déclarant",
		}).parentElement;
		expect(declarantGroup).toHaveTextContent("Non renseigné");
		expect(declarantGroup?.querySelector("dl")).toBeNull();
		expect(definitionValue("Raison sociale")).toBe(COMPANY.name);
	});
});
