import { describe, expect, it } from "vitest";

import type { CseRow, IndicatorGEntry } from "../fetchDeclarations";
import {
	assembleDeclaration,
	buildIndicatorG,
	buildIndicators,
} from "../fetchDeclarations";

// Minimal DeclarationRow used by buildIndicators / assembleDeclaration
const baseRow = {
	declarationId: "decl-1",
	siren: "123456789",
	year: 2027,
	status: "awaiting_compliance_path_choice" as const,
	firstDeclarationPathChoice: null,
	secondDeclarationPathChoice: null,
	totalWomen: 100,
	totalMen: 150,
	submittedAt: null as Date | null,
	firstDeclarationPathChoiceAt: null as Date | null,
	secondDeclarationPathChoiceAt: null as Date | null,
	secondDeclarationSubmittedAt: null as Date | null,
	jointEvaluationSubmittedAt: null as Date | null,
	cseOpinionCompletedAt: null as Date | null,
	demarcheCompletedAt: null as Date | null,
	phase2Required: false,
	phase2RevisionRequired: false,
	cseRequired: false,
	indicatorGRequired: false,
	rulesVersion: "2027.1",
	secondDeclReferencePeriodStart: null,
	secondDeclReferencePeriodEnd: null,
	createdAt: new Date("2027-03-15T10:00:00Z"),
	updatedAt: new Date("2027-03-15T12:00:00Z"),
	cancelledAt: null as Date | null,
	companyName: "ACME Corp",
	workforce: 250,
	nafCode: "62.02",
	address: "1 rue test",
	hasCse: true,
	declarantFirstName: "Jean",
	declarantLastName: "Dupont",
	declarantEmail: "jean@acme.fr",
	declarantPhone: "0612345678",
	// Indicator A
	indicatorAAnnualWomen: "35000",
	indicatorAAnnualMen: "38000",
	indicatorAHourlyWomen: "18.50",
	indicatorAHourlyMen: "19.20",
	// Indicator B
	indicatorBAnnualWomen: "2500",
	indicatorBAnnualMen: "3200",
	indicatorBHourlyWomen: "1.30",
	indicatorBHourlyMen: "1.60",
	// Indicator C
	indicatorCAnnualWomen: "33500",
	indicatorCAnnualMen: "36000",
	indicatorCHourlyWomen: "17.80",
	indicatorCHourlyMen: "18.50",
	// Indicator D
	indicatorDAnnualWomen: "2200",
	indicatorDAnnualMen: "2800",
	indicatorDHourlyWomen: "1.15",
	indicatorDHourlyMen: "1.40",
	// Indicator E
	indicatorEWomen: "95",
	indicatorEMen: "110",
	// Indicator F — annual
	indicatorFAnnualThreshold1: "22000",
	indicatorFAnnualWomen1: 35,
	indicatorFAnnualMen1: 28,
	indicatorFAnnualThreshold2: "28000",
	indicatorFAnnualWomen2: 30,
	indicatorFAnnualMen2: 32,
	indicatorFAnnualThreshold3: "36000",
	indicatorFAnnualWomen3: 28,
	indicatorFAnnualMen3: 33,
	indicatorFAnnualWomen4: 27,
	indicatorFAnnualMen4: 35,
	// Indicator F — hourly
	indicatorFHourlyThreshold1: "11.50",
	indicatorFHourlyWomen1: 40,
	indicatorFHourlyMen1: 25,
	indicatorFHourlyThreshold2: "14.00",
	indicatorFHourlyWomen2: 32,
	indicatorFHourlyMen2: 30,
	indicatorFHourlyThreshold3: "18.00",
	indicatorFHourlyWomen3: 28,
	indicatorFHourlyMen3: 33,
	indicatorFHourlyWomen4: 20,
	indicatorFHourlyMen4: 37,
	// Gaps A/B/C/D (ratio -1..1)
	globalAnnualMeanGap: "0.0455",
	globalHourlyMeanGap: "0.0360",
	variableAnnualMeanGap: "0.1500",
	variableHourlyMeanGap: "0.0750",
	globalAnnualMedianGap: "0.0390",
	globalHourlyMedianGap: "0.0310",
	variableAnnualMedianGap: "0.1200",
	variableHourlyMedianGap: "0.0600",
	// Proportions E
	variableProportionWomen: "0.4523",
	variableProportionMen: "0.5477",
	// Proportions F annual (persisted)
	annualQuartile1ProportionWomen: "0.5556",
	annualQuartile1ProportionMen: "0.4444",
	annualQuartile2ProportionWomen: "0.4839",
	annualQuartile2ProportionMen: "0.5161",
	annualQuartile3ProportionWomen: "0.4590",
	annualQuartile3ProportionMen: "0.5410",
	annualQuartile4ProportionWomen: "0.4355",
	annualQuartile4ProportionMen: "0.5645",
	// Proportions F hourly (persisted)
	hourlyQuartile1ProportionWomen: "0.6154",
	hourlyQuartile1ProportionMen: "0.3846",
	hourlyQuartile2ProportionWomen: "0.5161",
	hourlyQuartile2ProportionMen: "0.4839",
	hourlyQuartile3ProportionWomen: "0.4590",
	hourlyQuartile3ProportionMen: "0.5410",
	hourlyQuartile4ProportionWomen: "0.3509",
	hourlyQuartile4ProportionMen: "0.6491",
	statusHistoryArray: [] as Array<{
		eventType: string;
		value: string | null;
		round: number | null;
		createdAt: string;
	}>,
};

describe("buildIndicators", () => {
	it("should map indicator A with GIP labels", () => {
		const result = buildIndicators(baseRow);

		expect(result.A.Rem_globale_annuelle_moyenne_F).toBe("35000");
		expect(result.A.Rem_globale_annuelle_moyenne_H).toBe("38000");
		expect(result.A.Taux_horaire_global_moyen_F).toBe("18.50");
		expect(result.A.Taux_horaire_global_moyen_H).toBe("19.20");
	});

	it("should map indicator B with GIP labels", () => {
		const result = buildIndicators(baseRow);

		expect(result.B.Rem_variable_annuelle_moyenne_F).toBe("2500");
		expect(result.B.Rem_variable_annuelle_moyenne_H).toBe("3200");
	});

	it("should map indicator C and D with GIP labels", () => {
		const result = buildIndicators(baseRow);

		expect(result.C.Rem_globale_annuelle_médiane_F).toBe("33500");
		expect(result.D.Taux_horaire_variable_médian_H).toBe("1.40");
	});

	it("should map indicator E with GIP labels", () => {
		const result = buildIndicators(baseRow);

		expect(result.E.Effectif_F_rem_annuelle_variable).toBe("95");
		expect(result.E.Effectif_H_rem_annuelle_variable).toBe("110");
	});

	it("should expose indicator F proportions read from persisted DB columns", () => {
		const result = buildIndicators(baseRow);

		expect(result.F.annuel.Seuil_Q1_Rem_globale).toBe("22000");
		expect(result.F.annuel.Quartile1_Rem_globale_annuelle_proportion_F).toBe(
			"0.5556",
		);
		expect(result.F.annuel.Quartile1_Rem_globale_annuelle_proportion_H).toBe(
			"0.4444",
		);
		expect(result.F.annuel.Seuil_Q4_Rem_globale).toBeNull();
		expect(result.F.annuel.Quartile4_Rem_globale_annuelle_proportion_F).toBe(
			"0.4355",
		);
		expect(result.F.horaire.Seuil_Q1_Taux_horaire_global).toBe("11.50");
		expect(result.F.horaire.Quartile1_Taux_horaire_global_proportion_F).toBe(
			"0.6154",
		);
	});

	it("should expose gap labels for indicators A/B/C/D", () => {
		const result = buildIndicators(baseRow);

		expect(result.A.Rem_globale_annuelle_moyenne_ecart).toBe("0.0455");
		expect(result.A.Taux_horaire_global_moyen_ecart).toBe("0.0360");
		expect(result.B.Rem_variable_annuelle_moyenne_ecart).toBe("0.1500");
		expect(result.B.Taux_horaire_variable_moyen_ecart).toBe("0.0750");
		expect(result.C.Rem_globale_annuelle_médiane_ecart).toBe("0.0390");
		expect(result.C.Taux_horaire_global_médian_ecart).toBe("0.0310");
		expect(result.D.Rem_variable_annuelle_médiane_ecart).toBe("0.1200");
		expect(result.D.Taux_horaire_variable_médian_ecart).toBe("0.0600");
	});

	it("should expose proportion labels for indicator E", () => {
		const result = buildIndicators(baseRow);

		expect(result.E.Proportion_variable_F).toBe("0.4523");
		expect(result.E.Proportion_variable_H).toBe("0.5477");
	});

	it("should return null for F proportions and gap labels when DB columns are null", () => {
		const nullRow = {
			...baseRow,
			indicatorAAnnualWomen: null,
			indicatorAAnnualMen: null,
			indicatorEWomen: null,
			indicatorEMen: null,
			indicatorFAnnualThreshold1: null,
			indicatorFAnnualWomen1: null,
			indicatorFAnnualMen1: null,
			globalAnnualMeanGap: null,
			variableProportionWomen: null,
			annualQuartile1ProportionWomen: null,
			annualQuartile1ProportionMen: null,
			annualQuartile2ProportionWomen: null,
		};

		const result = buildIndicators(nullRow);

		expect(result.A.Rem_globale_annuelle_moyenne_F).toBeNull();
		expect(result.A.Rem_globale_annuelle_moyenne_ecart).toBeNull();
		expect(result.E.Effectif_F_rem_annuelle_variable).toBeNull();
		expect(result.E.Proportion_variable_F).toBeNull();
		expect(result.F.annuel.Seuil_Q1_Rem_globale).toBeNull();
		expect(
			result.F.annuel.Quartile1_Rem_globale_annuelle_proportion_F,
		).toBeNull();
		expect(
			result.F.annuel.Quartile1_Rem_globale_annuelle_proportion_H,
		).toBeNull();
		expect(
			result.F.annuel.Quartile2_Rem_globale_annuelle_proportion_F,
		).toBeNull();
	});
});

describe("buildIndicatorG", () => {
	it("should separate initial and correction entries with French keys", () => {
		const entries: IndicatorGEntry[] = [
			{
				categoryName: "Ouvriers",
				declarationType: "initial",
				womenCount: 40,
				menCount: 45,
				annualBaseWomen: "24000",
				annualBaseMen: "25500",
				annualVariableWomen: "1200",
				annualVariableMen: "1500",
				hourlyBaseWomen: "12.50",
				hourlyBaseMen: "13.20",
				hourlyVariableWomen: "0.62",
				hourlyVariableMen: "0.78",
			},
			{
				categoryName: "Ouvriers",
				declarationType: "correction",
				womenCount: 42,
				menCount: 44,
				annualBaseWomen: "24800",
				annualBaseMen: "25200",
				annualVariableWomen: "1350",
				annualVariableMen: "1400",
				hourlyBaseWomen: "12.90",
				hourlyBaseMen: "13.10",
				hourlyVariableWomen: "0.70",
				hourlyVariableMen: "0.73",
			},
		];

		const result = buildIndicatorG(entries);

		expect(result.initial).toHaveLength(1);
		expect(result.correction).toHaveLength(1);
		expect(result.initial[0]?.Nom_categorie).toBe("Ouvriers");
		expect(result.initial[0]?.Effectif_F).toBe(40);
		expect(result.correction[0]?.Effectif_F).toBe(42);
		expect(result.initial[0]?.Rem_annuelle_base_F).toBe("24000");
	});

	it("should return empty arrays when no entries", () => {
		const result = buildIndicatorG([]);

		expect(result.initial).toEqual([]);
		expect(result.correction).toEqual([]);
	});
});

describe("assembleDeclaration", () => {
	it("should assemble a full declaration with French top-level keys", () => {
		const result = assembleDeclaration(baseRow, [], []);

		expect(result.id).toBe("decl-1");
		expect(Object.keys(result)[0]).toBe("id");
		expect(result.SIREN).toBe("123456789");
		expect(result.Raison_sociale).toBe("ACME Corp");
		expect(result.Effectif).toBe(250);
		expect(result.CSE_existant).toBe(true);
		expect(result.Annee).toBe(2027);
		expect(result.Effectif_F_rem_annuelle_globale).toBe(100);
		expect(result.Effectif_H_rem_annuelle_globale).toBe(150);
		expect(result.Declarant.Email).toBe("jean@acme.fr");
		expect(result.Indicateurs.G).toBeNull();
		expect(result.Seconde_declaration.Correction).toBeNull();
		expect(result).not.toHaveProperty("Avis_CSE");
		expect(result).not.toHaveProperty("Fichiers_CSE");
		expect(result).not.toHaveProperty("Fichier_evaluation_conjointe");
		expect(result.Date_creation).toBe("2027-03-15T10:00:00.000Z");
	});

	it("should include indicator A–F values with GIP labels", () => {
		const result = assembleDeclaration(baseRow, [], []);

		expect(result.Indicateurs.A.Rem_globale_annuelle_moyenne_F).toBe("35000");
		expect(result.Indicateurs.B.Taux_horaire_variable_moyen_H).toBe("1.60");
		expect(result.Indicateurs.E.Effectif_F_rem_annuelle_variable).toBe("95");
		expect(result.Indicateurs.F.annuel.Seuil_Q1_Rem_globale).toBe("22000");
	});

	it("should include indicator G initial in Indicateurs and correction in Seconde_declaration", () => {
		const indicatorG: IndicatorGEntry[] = [
			{
				categoryName: "Cadres",
				declarationType: "initial",
				womenCount: 50,
				menCount: 60,
				annualBaseWomen: "52000",
				annualBaseMen: "56000",
				annualVariableWomen: null,
				annualVariableMen: null,
				hourlyBaseWomen: null,
				hourlyBaseMen: null,
				hourlyVariableWomen: null,
				hourlyVariableMen: null,
			},
			{
				categoryName: "Cadres",
				declarationType: "correction",
				womenCount: 52,
				menCount: 58,
				annualBaseWomen: "53000",
				annualBaseMen: "55000",
				annualVariableWomen: null,
				annualVariableMen: null,
				hourlyBaseWomen: null,
				hourlyBaseMen: null,
				hourlyVariableWomen: null,
				hourlyVariableMen: null,
			},
		];

		const result = assembleDeclaration(baseRow, indicatorG, []);

		expect(result.Indicateurs.G).toHaveLength(1);
		expect(result.Indicateurs.G?.[0]?.Effectif_F).toBe(50);
		expect(result.Seconde_declaration.Correction).toHaveLength(1);
		expect(result.Seconde_declaration.Correction?.[0]?.Effectif_F).toBe(52);
	});

	it("should map CSE opinions when at least one CSE file is present", () => {
		const opinions: CseRow[] = [
			{
				declarationNumber: 1,
				type: "accuracy",
				opinion: "favorable",
				opinionDate: "2027-01-15",
			},
		];
		const files = [
			{
				id: "file-xyz",
				siren: "123456789",
				year: 2027,
				fileName: "avis-cse.pdf",
				filePath: "/s3/path",
				uploadedAt: new Date("2027-02-10T08:30:00Z"),
			},
		];

		const result = assembleDeclaration(baseRow, [], opinions, files);

		expect(result.Avis_CSE).toEqual([
			{
				Numero_declaration: 1,
				Type: "accuracy",
				Avis: "favorable",
				Date: "2027-01-15",
			},
		]);
	});

	it("should omit Avis_CSE when no CSE file is attached", () => {
		const opinions: CseRow[] = [
			{
				declarationNumber: 1,
				type: "accuracy",
				opinion: "favorable",
				opinionDate: "2027-01-15",
			},
		];

		const result = assembleDeclaration(baseRow, [], opinions, []);

		expect(result).not.toHaveProperty("Avis_CSE");
		expect(result).not.toHaveProperty("Fichiers_CSE");
	});

	it("should expose CSE files with type, stored fileName and download URLs", () => {
		const files = [
			{
				id: "file-xyz",
				siren: "123456789",
				year: 2027,
				fileName: "avis-cse-original.pdf",
				filePath: "/s3/path",
				uploadedAt: new Date("2027-02-10T08:30:00Z"),
			},
		];

		const result = assembleDeclaration(baseRow, [], [], files);

		expect(result.Fichiers_CSE).toEqual([
			{
				Id: "file-xyz",
				Type: "cse_opinion",
				Nom_fichier: "avis-cse-original.pdf",
				Date_upload: "2027-02-10T08:30:00.000Z",
				URL_telechargement: "/api/v1/files/file-xyz",
			},
		]);
	});

	it("should expose the joint evaluation file with stored fileName", () => {
		const file = {
			id: "je-1",
			siren: "123456789",
			year: 2027,
			fileName: "eval-originale.pdf",
			filePath: "/s3/je",
			uploadedAt: new Date("2027-04-01T09:00:00Z"),
		};

		const result = assembleDeclaration(baseRow, [], [], [], [file]);

		expect(result.Fichier_evaluation_conjointe).toEqual({
			Id: "je-1",
			Type: "joint_evaluation",
			Nom_fichier: "eval-originale.pdf",
			Date_upload: "2027-04-01T09:00:00.000Z",
			URL_telechargement: "/api/v1/files/je-1",
		});
	});

	it("should keep the most recent joint evaluation file when several exist", () => {
		const files = [
			{
				id: "je-old",
				siren: "123456789",
				year: 2027,
				fileName: "old.pdf",
				filePath: "/s3/old",
				uploadedAt: new Date("2027-03-01T09:00:00Z"),
			},
			{
				id: "je-new",
				siren: "123456789",
				year: 2027,
				fileName: "new.pdf",
				filePath: "/s3/new",
				uploadedAt: new Date("2027-06-01T09:00:00Z"),
			},
		];

		const result = assembleDeclaration(baseRow, [], [], [], files);

		expect(result.Fichier_evaluation_conjointe?.Id).toBe("je-new");
	});

	it("should handle null dates", () => {
		const rowWithNullDates = { ...baseRow, createdAt: null, updatedAt: null };
		const result = assembleDeclaration(rowWithNullDates, [], []);

		expect(result.Date_creation).toBeNull();
		expect(result.Date_modification).toBeNull();
	});

	it("should expose Date_annulation as null for an active declaration", () => {
		const result = assembleDeclaration(baseRow, [], []);

		expect(result.Date_annulation).toBeNull();
	});

	it("should expose Date_annulation as ISO string for a cancelled declaration", () => {
		const cancelledRow = {
			...baseRow,
			cancelledAt: new Date("2027-04-15T08:00:00Z"),
		};
		const result = assembleDeclaration(cancelledRow, [], []);

		expect(result.Date_annulation).toBe("2027-04-15T08:00:00.000Z");
	});

	it("should preserve indicator data on a cancelled declaration", () => {
		const cancelledRow = {
			...baseRow,
			cancelledAt: new Date("2027-04-15T08:00:00Z"),
		};
		const indicatorG: IndicatorGEntry[] = [
			{
				categoryName: "Cadres",
				declarationType: "initial",
				womenCount: 12,
				menCount: 18,
				annualBaseWomen: "52000",
				annualBaseMen: "56000",
				annualVariableWomen: null,
				annualVariableMen: null,
				hourlyBaseWomen: null,
				hourlyBaseMen: null,
				hourlyVariableWomen: null,
				hourlyVariableMen: null,
			},
		];

		const result = assembleDeclaration(cancelledRow, indicatorG, []);

		expect(result.Date_annulation).toBe("2027-04-15T08:00:00.000Z");
		expect(result.Indicateurs.A.Rem_globale_annuelle_moyenne_F).toBe("35000");
		expect(result.Indicateurs.G).toHaveLength(1);
		expect(result.Indicateurs.G?.[0]?.Effectif_F).toBe(12);
		expect(result.SIREN).toBe("123456789");
		expect(result.Effectif).toBe(250);
	});

	it("should expose Historique_statuts as empty array when no history (S7)", () => {
		const result = assembleDeclaration(baseRow, [], []);

		expect(result.Historique_statuts).toEqual([]);
	});

	it("should expose Historique_statuts with FR labels for submit + demarche_complete (S1)", () => {
		const row = {
			...baseRow,
			statusHistoryArray: [
				{
					eventType: "submit",
					value: null,
					round: null,
					createdAt: "2027-03-15T10:00:00.123Z",
				},
				{
					eventType: "demarche_complete",
					value: null,
					round: null,
					createdAt: "2027-10-15T14:00:00.456Z",
				},
			],
		};

		const result = assembleDeclaration(row, [], []);

		expect(result.Historique_statuts).toEqual([
			{
				Statut: "submit",
				Libelle_statut: "Soumission de la déclaration",
				Date: "2027-03-15T10:00:00.123Z",
			},
			{
				Statut: "demarche_complete",
				Libelle_statut: "Démarche terminée",
				Date: "2027-10-15T14:00:00.456Z",
			},
		]);
	});

	it("should expose Round and Libelle for path_choice corrective_action (S2)", () => {
		const row = {
			...baseRow,
			statusHistoryArray: [
				{
					eventType: "path_choice",
					value: "corrective_action",
					round: 1,
					createdAt: "2027-04-01T10:00:00.000Z",
				},
			],
		};

		const result = assembleDeclaration(row, [], []);

		expect(result.Historique_statuts).toEqual([
			{
				Statut: "path_choice",
				Libelle_statut: "Choix du parcours — Actions correctives",
				Date: "2027-04-01T10:00:00.000Z",
				Round: 1,
			},
		]);
	});

	it("should expose all 5 lifecycle entries with FR labels (S3)", () => {
		const row = {
			...baseRow,
			statusHistoryArray: [
				{
					eventType: "submit",
					value: null,
					round: null,
					createdAt: "2027-03-15T10:00:00.000Z",
				},
				{
					eventType: "path_choice",
					value: "joint_evaluation",
					round: 1,
					createdAt: "2027-04-01T10:00:00.000Z",
				},
				{
					eventType: "joint_evaluation_submit",
					value: null,
					round: null,
					createdAt: "2027-09-01T12:00:00.000Z",
				},
				{
					eventType: "cse_opinion_submit",
					value: null,
					round: null,
					createdAt: "2027-10-01T13:00:00.000Z",
				},
				{
					eventType: "demarche_complete",
					value: null,
					round: null,
					createdAt: "2027-10-15T14:00:00.000Z",
				},
			],
		};

		const result = assembleDeclaration(row, [], []);

		expect(result.Historique_statuts).toHaveLength(5);
		expect(result.Historique_statuts[0]?.Libelle_statut).toBe(
			"Soumission de la déclaration",
		);
		expect(result.Historique_statuts[1]?.Libelle_statut).toBe(
			"Choix du parcours — Évaluation conjointe",
		);
		expect(result.Historique_statuts[1]).toHaveProperty("Round", 1);
		expect(result.Historique_statuts[2]?.Libelle_statut).toBe(
			"Dépôt du rapport d'évaluation conjointe",
		);
		expect(result.Historique_statuts[3]?.Libelle_statut).toBe(
			"Dépôt d'un avis CSE",
		);
		expect(result.Historique_statuts[4]?.Libelle_statut).toBe(
			"Démarche terminée",
		);
	});

	it("should expose two path_choice entries with their own Round (S4)", () => {
		const row = {
			...baseRow,
			statusHistoryArray: [
				{
					eventType: "path_choice",
					value: "justify",
					round: 1,
					createdAt: "2027-04-01T10:00:00.000Z",
				},
				{
					eventType: "path_choice",
					value: "corrective_action",
					round: 2,
					createdAt: "2027-08-01T10:00:00.000Z",
				},
			],
		};

		const result = assembleDeclaration(row, [], []);

		expect(result.Historique_statuts).toHaveLength(2);
		expect(result.Historique_statuts[0]).toMatchObject({
			Statut: "path_choice",
			Libelle_statut: "Choix du parcours — Justification de l'écart",
			Round: 1,
		});
		expect(result.Historique_statuts[1]).toMatchObject({
			Statut: "path_choice",
			Libelle_statut: "Choix du parcours — Actions correctives",
			Round: 2,
		});
	});

	it("should expose cancel entry with FR label while keeping Date_annulation (S5)", () => {
		const row = {
			...baseRow,
			cancelledAt: new Date("2027-04-15T08:00:00Z"),
			statusHistoryArray: [
				{
					eventType: "submit",
					value: null,
					round: null,
					createdAt: "2027-03-15T10:00:00.000Z",
				},
				{
					eventType: "cancel",
					value: null,
					round: null,
					createdAt: "2027-04-15T08:00:00.000Z",
				},
			],
		};

		const result = assembleDeclaration(row, [], []);

		expect(result.Historique_statuts).toHaveLength(2);
		expect(result.Historique_statuts[1]).toEqual({
			Statut: "cancel",
			Libelle_statut: "Annulation de la déclaration",
			Date: "2027-04-15T08:00:00.000Z",
		});
		expect(result.Date_annulation).toBe("2027-04-15T08:00:00.000Z");
	});

	it("should preserve the order returned by the query without re-sorting", () => {
		const row = {
			...baseRow,
			statusHistoryArray: [
				{
					eventType: "demarche_complete",
					value: null,
					round: null,
					createdAt: "2027-10-15T14:00:00.000Z",
				},
				{
					eventType: "submit",
					value: null,
					round: null,
					createdAt: "2027-03-15T10:00:00.000Z",
				},
			],
		};

		const result = assembleDeclaration(row, [], []);

		expect(result.Historique_statuts.map((e) => e.Statut)).toEqual([
			"demarche_complete",
			"submit",
		]);
	});

	it("should not add Round key when path_choice round is null", () => {
		const row = {
			...baseRow,
			statusHistoryArray: [
				{
					eventType: "path_choice",
					value: null,
					round: null,
					createdAt: "2027-04-01T10:00:00.000Z",
				},
			],
		};

		const result = assembleDeclaration(row, [], []);

		expect(result.Historique_statuts[0]).not.toHaveProperty("Round");
		expect(result.Historique_statuts[0]?.Libelle_statut).toBe(
			"Choix du parcours",
		);
	});
});
