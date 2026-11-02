import { beforeEach, describe, expect, it, vi } from "vitest";

type TableKey = "declarations" | "companies" | "gipMdsData" | "users" | "files";

const mocks = vi.hoisted(() => ({
	results: new Map<string, unknown[]>(),
	findTransmittedJointEvaluation: vi.fn(),
	getFileSize: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {
		select: () => ({
			from: (table: { __table: TableKey }) => ({
				where: () => ({
					limit: () => Promise.resolve(mocks.results.get(table.__table) ?? []),
				}),
			}),
		}),
	},
}));

vi.mock("~/server/db/schema", () => ({
	declarations: { __table: "declarations" },
	companies: { __table: "companies", siren: "siren" },
	gipMdsData: {
		__table: "gipMdsData",
		siren: "siren",
		year: "year",
		workforceEma: "workforceEma",
	},
	users: {
		__table: "users",
		id: "id",
		firstName: "firstName",
		lastName: "lastName",
		email: "email",
		phone: "phone",
	},
	files: { __table: "files", id: "id", filePath: "filePath" },
}));

vi.mock("~/server/api/routers/declarationHelpers", () => ({
	activeDeclarationFilter: (siren: string, year: number) => ({ siren, year }),
	findTransmittedJointEvaluation: mocks.findTransmittedJointEvaluation,
}));

vi.mock("~/server/services/s3", () => ({ getFileSize: mocks.getFileSize }));

import {
	buildJointEvaluationRecapData,
	JointEvaluationNotTransmittedError,
} from "../buildJointEvaluationRecapData";

const SIREN = "123456789";
const YEAR = 2027;
const DECLARATION = {
	id: "decl-1",
	declarantId: "user-1",
	secondDeclReferencePeriodStart: "2027-02-01",
	secondDeclReferencePeriodEnd: "2027-07-31",
};
const TRANSMITTED = {
	submission: { createdAt: new Date("2027-04-03T12:00:00Z"), round: 1 },
	file: {
		id: "file-1",
		fileName: "rapport.pdf",
		uploadedAt: new Date("2027-04-01T10:00:00Z"),
	},
};

function seed(rows: Partial<Record<TableKey, unknown[]>>) {
	mocks.results.clear();
	for (const [table, value] of Object.entries(rows)) {
		mocks.results.set(table, value);
	}
}

describe("buildJointEvaluationRecapData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findTransmittedJointEvaluation.mockResolvedValue(TRANSMITTED);
		mocks.getFileSize.mockResolvedValue(18_391);
		seed({
			declarations: [DECLARATION],
			companies: [
				{
					name: "Société Démo",
					address: "1 rue de Paris 75001 Paris",
					countryCode: null,
					countryLabel: null,
					departmentLabel: "Paris",
					nafCode: "62.01Z",
					nafLabel: "Programmation informatique",
					hasCse: false,
				},
			],
			gipMdsData: [{ workforceEma: "150" }],
			users: [
				{
					firstName: "Marie",
					lastName: "Dupont",
					email: "email@example.fr",
					phone: "01 02 03 04 05",
				},
			],
			files: [{ filePath: "joint/rapport.pdf" }],
		});
	});

	it("derives every displayed value once, for the document to lay out", async () => {
		const data = await buildJointEvaluationRecapData(SIREN, YEAR);

		expect(data).toEqual({
			year: YEAR,
			transmittedAt: "03/04/2027",
			referencePeriod: "01/01/2026 - 31/12/2026",
			declarant: {
				name: "Marie Dupont",
				email: "email@example.fr",
				phone: "01 02 03 04 05",
			},
			company: {
				name: "Société Démo",
				siren: "123 456 789",
				location: { label: "Adresse", value: "1 rue de Paris 75001 Paris" },
				naf: "62.01Z - Programmation informatique",
				workforceLabel: "Effectif annuel moyen en 2026",
				workforceDisplay: "150",
				cseDisplay: "Non",
			},
			file: {
				id: "file-1",
				name: "rapport.pdf",
				detail: "PDF – 17,96 Ko · déposé le 1ᵉʳ avril 2027",
			},
		});
		expect(mocks.findTransmittedJointEvaluation).toHaveBeenCalledWith(
			expect.anything(),
			"decl-1",
		);
		expect(mocks.getFileSize).toHaveBeenCalledWith("joint/rapport.pdf");
	});

	it("takes the second declaration period for a second-round transmission", async () => {
		mocks.findTransmittedJointEvaluation.mockResolvedValue({
			...TRANSMITTED,
			submission: { ...TRANSMITTED.submission, round: 2 },
		});

		const data = await buildJointEvaluationRecapData(SIREN, YEAR);

		expect(data.referencePeriod).toBe("01/02/2027 - 31/07/2027");
	});

	it("leaves the CSE row out below the CSE threshold", async () => {
		seed({
			...Object.fromEntries(mocks.results),
			gipMdsData: [{ workforceEma: "60" }],
		});

		const data = await buildJointEvaluationRecapData(SIREN, YEAR);

		expect(data.company.cseDisplay).toBeNull();
	});

	it("falls back on neutral values when the company, the declarant and the stored file are missing", async () => {
		seed({ declarations: [DECLARATION] });

		const data = await buildJointEvaluationRecapData(SIREN, YEAR);

		expect(data.company).toMatchObject({
			name: `Entreprise ${SIREN}`,
			location: { label: "Pays", value: "inconnu" },
			naf: "-",
		});
		expect(data.declarant).toEqual({ name: "", email: "", phone: "" });
		expect(data.file.detail).toBe("PDF · déposé le 1ᵉʳ avril 2027");
		expect(mocks.getFileSize).not.toHaveBeenCalled();
	});

	it("says the CSE presence is unknown when a company subject to it has no record", async () => {
		seed({
			declarations: [DECLARATION],
			gipMdsData: [{ workforceEma: "150" }],
		});

		const data = await buildJointEvaluationRecapData(SIREN, YEAR);

		expect(data.company.cseDisplay).toBe("Non renseigné");
	});

	it("refuses a year without declaration", async () => {
		seed({});

		await expect(buildJointEvaluationRecapData(SIREN, YEAR)).rejects.toThrow(
			JointEvaluationNotTransmittedError,
		);
		expect(mocks.findTransmittedJointEvaluation).not.toHaveBeenCalled();
	});

	it("refuses a declaration whose joint evaluation is not transmitted", async () => {
		mocks.findTransmittedJointEvaluation.mockResolvedValue(null);

		const error = await buildJointEvaluationRecapData(SIREN, YEAR).catch(
			(caught: unknown) => caught,
		);

		expect(error).toBeInstanceOf(JointEvaluationNotTransmittedError);
		expect(error).toMatchObject({
			name: "JointEvaluationNotTransmittedError",
			message: "Évaluation conjointe non transmise",
		});
	});
});
