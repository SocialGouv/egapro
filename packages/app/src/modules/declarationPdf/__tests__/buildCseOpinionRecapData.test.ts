import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	declarationRows: [] as unknown[],
	findTransmittedCseOpinions: vi.fn(),
	getFileSize: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () => Promise.resolve(mocks.declarationRows),
				}),
			}),
		}),
	},
}));

vi.mock("~/server/db/schema", () => ({ declarations: { id: "id" } }));

vi.mock("~/server/api/routers/declarationHelpers", () => ({
	activeDeclarationFilter: (siren: string, year: number) => ({ siren, year }),
	findTransmittedCseOpinions: mocks.findTransmittedCseOpinions,
}));

vi.mock("~/server/services/s3", () => ({ getFileSize: mocks.getFileSize }));

import type { TransmittedCseOpinions } from "~/server/api/routers/declarationHelpers";
import {
	assembleCseOpinionRecap,
	buildCseOpinionRecapData,
	CseOpinionNotTransmittedError,
	cseOpinionPdfFilename,
} from "../buildCseOpinionRecapData";

const SIREN = "123456789";
const YEAR = 2027;

function transmission(
	overrides: Partial<TransmittedCseOpinions> = {},
): TransmittedCseOpinions {
	return {
		year: YEAR,
		secondDeclReferencePeriodStart: "2027-02-01",
		secondDeclReferencePeriodEnd: "2027-07-31",
		submittedAt: new Date("2027-02-10T10:00:00.000Z"),
		workforceEma: "150",
		hasSubmittedSecondDeclaration: false,
		company: {
			name: "Société Démo",
			siren: SIREN,
			address: "1 rue de Paris 75001 Paris",
			countryCode: null,
			countryLabel: null,
			departmentLabel: "Paris",
			nafCode: "62.02A",
			nafLabel: "Conseil en systèmes",
			hasCse: true,
		},
		declarant: {
			firstName: "Marie",
			lastName: "Dupont",
			email: "email@example.fr",
			phone: "01 02 03 04 05",
		},
		opinions: [
			{
				declarationNumber: 1,
				type: "accuracy",
				gapConsulted: null,
				opinion: "favorable",
				opinionDate: "2027-02-01",
			},
		],
		associations: [
			{
				declarationNumber: 1,
				type: "accuracy",
				fileId: "file-1",
				fileName: "avis.pdf",
				filePath: "cse/avis.pdf",
				uploadedAt: new Date("2026-08-17T10:00:00.000Z"),
			},
		],
		...overrides,
	};
}

describe("cseOpinionPdfFilename", () => {
	it("names the recap after the SIREN and the year", () => {
		expect(cseOpinionPdfFilename(SIREN, YEAR)).toBe(
			"avis-cse-123456789-2027.pdf",
		);
	});
});

describe("assembleCseOpinionRecap", () => {
	beforeEach(() => {
		mocks.getFileSize.mockReset();
		mocks.getFileSize.mockResolvedValue(18_391);
	});

	it("lays out the declarant and the company with the recap wording", async () => {
		const recap = await assembleCseOpinionRecap(transmission());

		expect(recap).toMatchObject({
			year: YEAR,
			transmittedAt: "10/02/2027",
			company: { name: "Société Démo", siren: "123 456 789" },
			declarantRows: [
				{ label: "Nom Prénom", value: "Marie Dupont" },
				{ label: "Adresse email", value: "email@example.fr" },
				{ label: "Numéro de téléphone", value: "01 02 03 04 05" },
			],
			referencePeriods: [
				{ label: "Période de référence", value: "01/01/2026 - 31/12/2026" },
			],
		});
		expect(recap.companyRows).toEqual([
			{ label: "Raison sociale", value: "Société Démo" },
			{ label: "SIREN", value: "123 456 789" },
			{ label: "Adresse", value: "1 rue de Paris 75001 Paris" },
			{ label: "Code NAF", value: "62.02A - Conseil en systèmes" },
			{ label: "Effectif annuel moyen en 2026", value: "150" },
			{ label: "Existence d'un CSE", value: "Oui" },
		]);
	});

	it("leaves the CSE row out below the workforce threshold", async () => {
		const recap = await assembleCseOpinionRecap(
			transmission({ workforceEma: "60" }),
		);

		expect(recap.companyRows.map((row) => row.label)).not.toContain(
			"Existence d'un CSE",
		);
	});

	it("leaves the location row out for a domestic company without address", async () => {
		const base = transmission();
		const recap = await assembleCseOpinionRecap(
			transmission({ company: { ...base.company, address: "" } }),
		);

		expect(recap.companyRows.map((row) => row.label)).not.toContain("Adresse");
	});

	it("falls back when the declarant has no name nor phone", async () => {
		const recap = await assembleCseOpinionRecap(
			transmission({
				declarant: {
					firstName: null,
					lastName: null,
					email: "email@example.fr",
					phone: null,
				},
			}),
		);

		expect(recap.declarantRows[0]?.value).toBe("Non renseigné");
		expect(recap.declarantRows[2]?.value).toBe("Non renseigné");
	});

	it("shows both reference periods when a second declaration was transmitted", async () => {
		const recap = await assembleCseOpinionRecap(
			transmission({ hasSubmittedSecondDeclaration: true }),
		);

		expect(recap.referencePeriods).toEqual([
			{
				label: "Période de référence de la première déclaration",
				value: "01/01/2026 - 31/12/2026",
			},
			{
				label: "Période de référence de la seconde déclaration",
				value: "01/02/2027 - 31/07/2027",
			},
		]);
		expect(recap.declarations.map((d) => d.title)).toEqual([
			"Première déclaration",
			"Seconde déclaration",
		]);
	});

	it("lists each file once with its meta line and associated columns", async () => {
		const shared = {
			fileId: "file-1",
			fileName: "avis.pdf",
			filePath: "cse/avis.pdf",
			uploadedAt: new Date("2026-08-17T10:00:00.000Z"),
		};
		const recap = await assembleCseOpinionRecap(
			transmission({
				associations: [
					{
						declarationNumber: 1,
						type: "gap",
						fileId: "file-2",
						fileName: "justification.pdf",
						filePath: "cse/justification.pdf",
						uploadedAt: new Date("2026-08-18T10:00:00.000Z"),
					},
					{ ...shared, declarationNumber: 1, type: "accuracy" },
					{ ...shared, declarationNumber: 2, type: "accuracy" },
				],
			}),
		);

		expect(recap.files).toEqual([
			{
				id: "file-1",
				name: "avis.pdf",
				detail: "PDF – 17,96 Ko · déposé le 17 août 2026",
				columnIds: ["1:accuracy", "2:accuracy"],
			},
			{
				id: "file-2",
				name: "justification.pdf",
				detail: "PDF – 17,96 Ko · déposé le 18 août 2026",
				columnIds: ["1:gap"],
			},
		]);
		expect(mocks.getFileSize).toHaveBeenCalledTimes(2);
		expect(recap.fileColumns.map((column) => column.id)).toEqual([
			"1:accuracy",
			"1:gap",
			"2:accuracy",
		]);
	});

	it("orders files deposited at the same time by name", async () => {
		const uploadedAt = new Date("2026-08-17T10:00:00.000Z");
		const recap = await assembleCseOpinionRecap(
			transmission({
				associations: ["b.pdf", "a.pdf"].map((fileName) => ({
					declarationNumber: 1,
					type: "accuracy",
					fileId: fileName,
					fileName,
					filePath: `cse/${fileName}`,
					uploadedAt,
				})),
			}),
		);

		expect(recap.files.map((file) => file.name)).toEqual(["a.pdf", "b.pdf"]);
	});

	it("keeps the format alone when the stored size cannot be read", async () => {
		mocks.getFileSize.mockResolvedValue(null);

		const recap = await assembleCseOpinionRecap(transmission());

		expect(recap.files[0]?.detail).toBe("PDF · déposé le 17 août 2026");
	});
});

describe("buildCseOpinionRecapData", () => {
	beforeEach(() => {
		mocks.findTransmittedCseOpinions.mockReset();
		mocks.getFileSize.mockResolvedValue(null);
		mocks.declarationRows = [{ id: "decl-1" }];
	});

	it("assembles the recap of the transmitted opinions", async () => {
		mocks.findTransmittedCseOpinions.mockResolvedValue(transmission());

		const recap = await buildCseOpinionRecapData(SIREN, YEAR);

		expect(mocks.findTransmittedCseOpinions).toHaveBeenCalledWith(
			expect.anything(),
			"decl-1",
		);
		expect(recap.year).toBe(YEAR);
	});

	it("refuses a year without any declaration", async () => {
		mocks.declarationRows = [];

		await expect(buildCseOpinionRecapData(SIREN, YEAR)).rejects.toThrow(
			CseOpinionNotTransmittedError,
		);
		expect(mocks.findTransmittedCseOpinions).not.toHaveBeenCalled();
	});

	it("refuses opinions that are not transmitted as they stand", async () => {
		mocks.findTransmittedCseOpinions.mockResolvedValue(null);

		await expect(buildCseOpinionRecapData(SIREN, YEAR)).rejects.toThrow(
			"Avis du CSE non transmis",
		);
	});
});
