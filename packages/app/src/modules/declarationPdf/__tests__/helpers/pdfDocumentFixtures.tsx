import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

import { makeCategory } from "~/modules/declaration-remuneration/recapitulatif/__tests__/fixtures";
import { noPayGapReferences } from "~/test/gipGapFixtures";

import type { CseOpinionRecapData } from "../../buildCseOpinionRecapData";
import type { JointEvaluationRecapData } from "../../buildJointEvaluationRecapData";
import type { PrefillPdfData } from "../../buildPrefillPdfData";
import type { RepresentationPdfData } from "../../buildRepresentationPdfData";
import type { TransmittedPdfData } from "../../buildTransmittedPdfData";
import { CseOpinionPdfDocument } from "../../CseOpinionPdfDocument";
import { DeclarationPdfDocument } from "../../DeclarationPdfDocument";
import { JointEvaluationPdfDocument } from "../../JointEvaluationPdfDocument";
import { PrefillPdfDocument } from "../../PrefillPdfDocument";
import { RepresentationPdfDocument } from "../../RepresentationPdfDocument";
import { TransmittedPdfDocument } from "../../TransmittedPdfDocument";
import type { DeclarationPdfData } from "../../types";

const QUARTILES = [
	{ threshold: "20700.35", women: 60, men: 30 },
	{ threshold: "25750.99", women: 40, men: 30 },
	{ threshold: "31900.10", women: 24, men: 31 },
	{ women: 15, men: 26 },
];

export const DECLARATION_DATA: DeclarationPdfData = {
	year: 2026,
	workforceYear: 2025,
	isSecondDeclaration: false,
	indicatorGRequired: true,
	transmittedAt: "05/03/2026",
	referencePeriod: "01/01/2025 - 31/12/2025",
	declarant: {
		name: "Jean Martin",
		email: "email@example.fr",
		phone: "01 02 03 04 05",
	},
	company: {
		name: "Société Démo",
		siren: "123456789",
		address: "1 rue de la Démo, 75001 Paris",
		nafCode: "62.02A",
		nafLabel: "Conseil en systèmes et logiciels informatiques",
		workforceDisplay: "250",
	},
	totalWomen: 120,
	totalMen: 100,
	hourlyWomen: 50,
	hourlyMen: 60,
	step2Data: {
		indicatorAAnnualWomen: "35000",
		indicatorAAnnualMen: "37000",
		indicatorAHourlyWomen: "13",
		indicatorAHourlyMen: "14",
		indicatorCAnnualWomen: "34000",
		indicatorCAnnualMen: "36000",
		indicatorCHourlyWomen: "12",
		indicatorCHourlyMen: "13",
	},
	step3Data: {
		indicatorBAnnualWomen: "400",
		indicatorBAnnualMen: "450",
		indicatorBHourlyWomen: "2",
		indicatorBHourlyMen: "3",
		indicatorDAnnualWomen: "300",
		indicatorDAnnualMen: "350",
		indicatorDHourlyWomen: "1",
		indicatorDHourlyMen: "2",
		indicatorEWomen: "60",
		indicatorEMen: "70",
	},
	step4Data: { annual: QUARTILES, hourly: QUARTILES },
	step2Gaps: noPayGapReferences(),
	step3Gaps: noPayGapReferences(),
	categories: [
		makeCategory({ name: "Ouvriers", womenCount: 10, menCount: 15 }),
		makeCategory({
			name: "Cadres",
			womenCount: 12,
			menCount: 18,
			annualBaseWomen: "40000",
			annualBaseMen: "42000",
			annualVariableWomen: "4000",
			annualVariableMen: "2000",
		}),
	],
	source: "Accord d'entreprise",
};

// Built by hand rather than through buildPrefillPdfData, whose barrel import
// drags SCSS modules into the tsx-run scripts/check-pdf-ua.ts.
export const PREFILL_DATA: PrefillPdfData = {
	siren: "123456789",
	year: 2027,
	companyName: "Société Démo",
	address: "1 rue de la Démo, 75001 Paris",
	naf: "62.02A - Conseil en systèmes et logiciels informatiques",
	workforceYear: 2026,
	workforceDisplay: "250",
	cseDisplay: "Oui",
	referencePeriod: "01/01/2026 - 31/12/2026",
	totalWomen: 120,
	totalMen: 100,
	hourlyWomen: 50,
	hourlyMen: 60,
	step2Data: DECLARATION_DATA.step2Data,
	step2Gaps: noPayGapReferences(),
	step3Data: DECLARATION_DATA.step3Data,
	step3Gaps: noPayGapReferences(),
	step4Data: DECLARATION_DATA.step4Data,
};

export const TRANSMITTED_DATA: TransmittedPdfData = {
	companyName: "Société Démo",
	siren: "123456789",
	dataYear: 2024,
	year: 2025,
	generatedAt: "10 mars 2026",
	opinions: [
		{
			declarationNumber: 1,
			type: "initial",
			opinion: "favorable",
			opinionDate: "2026-01-15",
			gapConsulted: true,
		},
	],
	cseFiles: [
		{ fileName: "avis-cse-2026.pdf", uploadedAt: new Date(2026, 0, 20) },
	],
	jointEvaluationFile: {
		fileName: "evaluation-conjointe.pdf",
		uploadedAt: new Date(2026, 2, 1),
	},
	formalNoticeJointEvaluationFile: {
		fileName: "mise-en-demeure.pdf",
		uploadedAt: new Date(2026, 3, 1),
	},
};

export const REPRESENTATION_DATA: RepresentationPdfData = {
	companyName: "Société Démo",
	siren: "123456789",
	year: 2025,
	campaignYear: 2026,
	referencePeriodStart: "2025-01-01",
	referencePeriodEnd: "2025-12-31",
	indicators: [
		{
			title: "Cadres dirigeants",
			notComputableReason: null,
			womenPercent: 60,
			menPercent: 40,
			verdict: "compliant",
		},
		{
			title: "Membres des instances dirigeantes",
			notComputableReason: "Effectif insuffisant",
			womenPercent: null,
			menPercent: null,
			verdict: "not_applicable",
		},
	],
	publicationApplicable: true,
	publishDate: "2026-03-01",
	hasWebsite: true,
	publishUrl: "https://exemple.fr/egalite-professionnelle",
	publishModalities: null,
	submittedAt: new Date("2026-03-10T08:00:00.000Z"),
	generatedAt: new Date("2026-06-15T09:30:00.000Z"),
};

export const JOINT_EVALUATION_DATA: JointEvaluationRecapData = {
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

export const CSE_OPINION_DATA: CseOpinionRecapData = {
	year: 2027,
	transmittedAt: "10/12/2027",
	company: { name: "Société Démo", siren: "123 456 789" },
	declarantRows: [
		{ label: "Nom Prénom", value: "Marie Dupont" },
		{ label: "Adresse email", value: "email@example.fr" },
	],
	companyRows: [
		{ label: "Raison sociale", value: "Société Démo" },
		{ label: "SIREN", value: "123 456 789" },
	],
	referencePeriods: [
		{ label: "Période de référence", value: "01/01/2026 - 31/12/2026" },
	],
	declarations: [
		{
			declarationNumber: 1,
			title: "Première déclaration",
			opinions: [
				{
					id: "1:accuracy",
					title: "Avis sur l'exactitude des données",
					rows: [
						{ label: "Avis du CSE", value: "Favorable" },
						{ label: "Date de l'avis rendu par le CSE", value: "07/08/2026" },
					],
				},
			],
		},
	],
	fileColumns: [
		{
			id: "1:accuracy",
			label: "Exactitude",
			declarationLabel: "1re déclaration",
		},
		{
			id: "1:gap",
			label: "Justification",
			declarationLabel: "1re déclaration",
		},
	],
	files: [
		{
			id: "file-1",
			name: "avis-cse-1.pdf",
			detail: "PDF – 17,96 Ko · déposé le 17 août 2026",
			columnIds: ["1:accuracy"],
		},
	],
};

export type PdfDocumentSample = {
	name: string;
	title: string;
	element: ReactElement<DocumentProps>;
};

export function pdfDocumentSamples(): PdfDocumentSample[] {
	return [
		{
			name: "declaration",
			title:
				"Récapitulatif de la déclaration des indicateurs de rémunération 2026",
			element: DeclarationPdfDocument({ data: DECLARATION_DATA }),
		},
		{
			name: "second-declaration",
			title:
				"Récapitulatif de la seconde déclaration des écarts de rémunération par catégorie d'emplois 2026",
			element: DeclarationPdfDocument({
				data: { ...DECLARATION_DATA, isSecondDeclaration: true },
			}),
		},
		{
			name: "transmitted",
			title: "Récapitulatif des éléments transmis 2026",
			element: TransmittedPdfDocument({ data: TRANSMITTED_DATA }),
		},
		{
			name: "prefill",
			title:
				"Données préremplies : Déclaration des indicateurs de rémunération 2027",
			element: PrefillPdfDocument({ data: PREFILL_DATA }),
		},
		{
			name: "representation",
			title: "Démarche des indicateurs de représentation 2026",
			element: RepresentationPdfDocument({ data: REPRESENTATION_DATA }),
		},
		{
			name: "joint-evaluation",
			title: "Récapitulatif : Évaluation conjointe des rémunérations 2027",
			element: JointEvaluationPdfDocument({ data: JOINT_EVALUATION_DATA }),
		},
		{
			name: "cse-opinion",
			title: "Récapitulatif : Transmission du ou des avis du CSE 2027",
			element: CseOpinionPdfDocument({ data: CSE_OPINION_DATA }),
		},
	];
}
