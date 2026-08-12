import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeRepresentationRow as makeRow } from "./helpers/representationRowFixture";

const mockWhere = vi.fn();
const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockSelect = vi.fn<(fields: Record<string, unknown>) => unknown>(() => ({
	from: mockFrom,
}));

vi.mock("~/server/db", () => ({
	db: { select: (fields: Record<string, unknown>) => mockSelect(fields) },
}));

const SUIT_REPRESENTATION_KEYS = [
	"id",
	"SIREN",
	"Raison_sociale",
	"Adresse",
	"Code_NAF",
	"Région",
	"Département",
	"Année_référence",
	"Période_référence_début",
	"Période_référence_fin",
	"Pourcentage_femmes_cadres",
	"Pourcentage_hommes_cadres",
	"Motif_non_calculabilité_cadres",
	"Pourcentage_femmes_membres",
	"Pourcentage_hommes_membres",
	"Motif_non_calculabilité_membres",
	"Date_publication",
	"URL_publication",
	"Modalités_communication",
	"Date_déclaration",
];

function compile(condition: SQL | undefined): {
	sql: string;
	params: unknown[];
} {
	if (!condition) {
		throw new Error("no condition to compile");
	}
	const dialect = new PgDialect({ casing: "snake_case" });
	const built = dialect.sqlToQuery(condition);
	return { sql: built.sql, params: built.params };
}

function toIsoString(param: unknown): unknown {
	return param instanceof Date ? param.toISOString() : param;
}

describe("assembleRepresentation", () => {
	it("should map a row to the SUIT payload with the agreed French keys, in order", async () => {
		const { assembleRepresentation } = await import("../fetchRepresentations");

		const payload = assembleRepresentation(makeRow());

		expect(Object.keys(payload)).toEqual(SUIT_REPRESENTATION_KEYS);
		expect(payload).toEqual({
			id: "repr-1",
			SIREN: "123456789",
			Raison_sociale: "Entreprise Test",
			Adresse: "1 rue de la Paix, 75002 Paris",
			Code_NAF: "62.02A",
			Région: "Île-de-France",
			Département: "Paris",
			Année_référence: 2027,
			Période_référence_début: "2027-01-01",
			Période_référence_fin: "2027-12-31",
			Pourcentage_femmes_cadres: 40,
			Pourcentage_hommes_cadres: 60,
			Motif_non_calculabilité_cadres: null,
			Pourcentage_femmes_membres: 45.5,
			Pourcentage_hommes_membres: 54.5,
			Motif_non_calculabilité_membres: null,
			Date_publication: "2028-03-01",
			URL_publication: "https://example.fr/representation",
			Modalités_communication: "Site internet",
			Date_déclaration: "2027-03-15T10:00:00.000Z",
		});
	});

	it("should convert the numeric percentage strings to numbers", async () => {
		const { assembleRepresentation } = await import("../fetchRepresentations");

		const payload = assembleRepresentation(
			makeRow({
				executiveWomenPercent: "33.33",
				executiveMenPercent: "66.67",
				memberWomenPercent: "0.00",
				memberMenPercent: "100.00",
			}),
		);

		expect(payload.Pourcentage_femmes_cadres).toBe(33.33);
		expect(payload.Pourcentage_hommes_cadres).toBe(66.67);
		expect(payload.Pourcentage_femmes_membres).toBe(0);
		expect(payload.Pourcentage_hommes_membres).toBe(100);
	});

	it("should return null percentages when the declaration is not computable", async () => {
		const { assembleRepresentation } = await import("../fetchRepresentations");

		const payload = assembleRepresentation(
			makeRow({
				executiveWomenPercent: null,
				executiveMenPercent: null,
				notComputableReasonExecutives: "aucun_cadre_dirigeant",
				memberWomenPercent: null,
				memberMenPercent: null,
				notComputableReasonMembers: "aucune_instance_dirigeante",
			}),
		);

		expect(payload.Pourcentage_femmes_cadres).toBeNull();
		expect(payload.Pourcentage_hommes_cadres).toBeNull();
		expect(payload.Motif_non_calculabilité_cadres).toBe(
			"aucun_cadre_dirigeant",
		);
		expect(payload.Pourcentage_femmes_membres).toBeNull();
		expect(payload.Pourcentage_hommes_membres).toBeNull();
		expect(payload.Motif_non_calculabilité_membres).toBe(
			"aucune_instance_dirigeante",
		);
	});

	it("should serialise the submission date as an ISO string and null when absent", async () => {
		const { assembleRepresentation } = await import("../fetchRepresentations");

		expect(
			assembleRepresentation(
				makeRow({ submittedAt: new Date("2027-12-31T23:59:59Z") }),
			).Date_déclaration,
		).toBe("2027-12-31T23:59:59.000Z");
		expect(
			assembleRepresentation(makeRow({ submittedAt: null })).Date_déclaration,
		).toBeNull();
	});

	it("should keep the optional publication and reference-period fields nullable", async () => {
		const { assembleRepresentation } = await import("../fetchRepresentations");

		const payload = assembleRepresentation(
			makeRow({
				referencePeriodStart: null,
				referencePeriodEnd: null,
				publishDate: null,
				publishUrl: null,
				publishModalities: null,
			}),
		);

		expect(payload.Période_référence_début).toBeNull();
		expect(payload.Période_référence_fin).toBeNull();
		expect(payload.Date_publication).toBeNull();
		expect(payload.URL_publication).toBeNull();
		expect(payload.Modalités_communication).toBeNull();
	});

	it("should keep identity and location complete for a non-diffusible company (S30)", async () => {
		const { assembleRepresentation } = await import("../fetchRepresentations");

		const payload = assembleRepresentation(
			makeRow({
				siren: "123456789",
				companyName: "Entreprise Non Diffusible",
				address: "2 rue Secrète, 69001 Lyon",
				nafCode: "70.10Z",
				region: "Auvergne-Rhône-Alpes",
				departmentLabel: "Rhône",
			}),
		);

		expect(payload.Raison_sociale).toBe("Entreprise Non Diffusible");
		expect(payload.Adresse).toBe("2 rue Secrète, 69001 Lyon");
		expect(payload.Code_NAF).toBe("70.10Z");
		expect(payload.Région).toBe("Auvergne-Rhône-Alpes");
		expect(payload.Département).toBe("Rhône");
	});

	it("should pass through the nullable company columns without inventing a placeholder", async () => {
		const { assembleRepresentation } = await import("../fetchRepresentations");

		const payload = assembleRepresentation(
			makeRow({
				address: null,
				nafCode: null,
				region: null,
				departmentLabel: null,
			}),
		);

		expect(payload.Raison_sociale).toBe("Entreprise Test");
		expect(payload.Adresse).toBeNull();
		expect(payload.Code_NAF).toBeNull();
		expect(payload.Région).toBeNull();
		expect(payload.Département).toBeNull();
	});
});

describe("fetchSubmittedRepresentations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockWhere.mockResolvedValue([]);
	});

	it("should return the rows produced by the driver", async () => {
		const rows = [makeRow()];
		mockWhere.mockResolvedValue(rows);

		const { fetchSubmittedRepresentations } = await import(
			"../fetchRepresentations"
		);
		await expect(
			fetchSubmittedRepresentations("2027-03-15", "2027-03-16"),
		).resolves.toEqual(rows);
	});

	it("should inner-join companies on the declaration siren", async () => {
		const { fetchSubmittedRepresentations } = await import(
			"../fetchRepresentations"
		);
		await fetchSubmittedRepresentations("2027-03-15", "2027-03-16");

		expect(mockInnerJoin).toHaveBeenCalledTimes(1);
		const joinCall = mockInnerJoin.mock.calls[0] as unknown as
			| [unknown, SQL]
			| undefined;
		const { sql } = compile(joinCall?.[1]);

		expect(sql).toContain(
			'"app_representation_declaration"."siren" = "app_company"."siren"',
		);
	});

	it("should select the identity and location columns SUIT needs", async () => {
		const { fetchSubmittedRepresentations } = await import(
			"../fetchRepresentations"
		);
		await fetchSubmittedRepresentations("2027-03-15", "2027-03-16");

		const fields = mockSelect.mock.calls[0]?.[0];
		expect(fields).toBeDefined();
		for (const column of [
			"companyName",
			"address",
			"nafCode",
			"region",
			"departmentLabel",
		]) {
			expect(fields).toHaveProperty(column);
		}
	});

	it("should not select statutDiffusion, which SUIT must never be filtered on (S30)", async () => {
		const { fetchSubmittedRepresentations } = await import(
			"../fetchRepresentations"
		);
		await fetchSubmittedRepresentations("2027-03-15", "2027-03-16");

		expect(mockSelect.mock.calls[0]?.[0]).not.toHaveProperty("statutDiffusion");
	});

	it("should keep only submitted declarations", async () => {
		const { fetchSubmittedRepresentations } = await import(
			"../fetchRepresentations"
		);
		await fetchSubmittedRepresentations("2027-03-15", "2027-03-16");

		const { sql, params } = compile(mockWhere.mock.calls[0]?.[0] as SQL);

		expect(sql).toContain('"status" =');
		expect(params).toContain("submitted");
	});

	it("should bound submittedAt on an inclusive begin and an exclusive end, in UTC", async () => {
		const { fetchSubmittedRepresentations } = await import(
			"../fetchRepresentations"
		);
		await fetchSubmittedRepresentations("2027-03-15", "2027-03-20");

		const { sql, params } = compile(mockWhere.mock.calls[0]?.[0] as SQL);

		expect(sql).toContain('"submitted_at" >=');
		expect(sql).toContain('"submitted_at" <');
		// Bound as timestamp params mapped by the column, never inlined as text.
		expect(params.map(toIsoString)).toEqual([
			"submitted",
			"2027-03-15T00:00:00.000Z",
			"2027-03-20T00:00:00.000Z",
		]);
	});

	it("should shift both bounds when the window moves", async () => {
		const { fetchSubmittedRepresentations } = await import(
			"../fetchRepresentations"
		);
		await fetchSubmittedRepresentations("2026-12-31", "2027-01-01");

		const { params } = compile(mockWhere.mock.calls[0]?.[0] as SQL);

		expect(params.map(toIsoString).slice(1)).toEqual([
			"2026-12-31T00:00:00.000Z",
			"2027-01-01T00:00:00.000Z",
		]);
	});
});
