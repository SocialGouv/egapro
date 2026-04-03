import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockLimit = vi.fn();
const mockWhere = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();

let selectCallCount = 0;

vi.mock("~/server/db", () => ({
	db: {
		select: (...args: unknown[]) => mockSelect(...args),
	},
}));

describe("buildTransmittedPdfData", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		selectCallCount = 0;
	});

	function setupMockDb(
		company: Record<string, unknown> | null,
		declaration: Record<string, unknown> | null,
		opinions: unknown[] = [],
		cseFiles: unknown[] = [],
		jointFiles: unknown[] = [],
	) {
		// 5 select calls:
		// 1) company, 2) declaration (parallel Promise.all)
		// 3) opinions, 4) cseFiles, 5) jointFiles (parallel Promise.all)
		const results = [
			company ? [company] : [],
			declaration ? [declaration] : [],
			opinions,
			cseFiles,
			jointFiles,
		];

		mockLimit.mockImplementation(() => {
			return Promise.resolve(results[selectCallCount - 1] ?? []);
		});
		mockWhere.mockImplementation(() => {
			const res = results[selectCallCount - 1] ?? [];
			return Object.assign(Promise.resolve(res), { limit: mockLimit });
		});
		mockFrom.mockReturnValue({ where: mockWhere });
		mockSelect.mockImplementation(() => {
			selectCallCount++;
			return { from: mockFrom };
		});
	}

	it("returns assembled PDF data with declaration lookup", async () => {
		setupMockDb(
			{ name: "ACME Corp", siren: "123456789" },
			{ id: "decl-1", year: 2025 },
			[
				{
					declarationNumber: 1,
					type: "accuracy",
					opinion: "favorable",
					opinionDate: "2026-01-15",
					gapConsulted: null,
				},
			],
			[{ fileName: "avis.pdf", uploadedAt: new Date("2026-03-01") }],
			[{ fileName: "eval.pdf", uploadedAt: new Date("2026-03-02") }],
		);

		const { buildTransmittedPdfData } = await import(
			"../buildTransmittedPdfData"
		);
		const result = await buildTransmittedPdfData(
			"123456789",
			2025,
			new Date("2026-03-15"),
		);

		expect(result.companyName).toBe("ACME Corp");
		expect(result.siren).toBe("123456789");
		expect(result.year).toBe(2025);
		expect(result.dataYear).toBe(2024);
		expect(result.opinions).toHaveLength(1);
		expect(result.cseFiles).toHaveLength(1);
		expect(result.jointEvaluationFile).not.toBeNull();
		expect(result.jointEvaluationFile?.fileName).toBe("eval.pdf");
	});

	it("throws when company is not found", async () => {
		setupMockDb(null, { id: "decl-1", year: 2025 });

		const { buildTransmittedPdfData } = await import(
			"../buildTransmittedPdfData"
		);

		await expect(
			buildTransmittedPdfData("999999999", 2025, new Date()),
		).rejects.toThrow("Entreprise introuvable");
	});

	it("throws when declaration is not found", async () => {
		setupMockDb({ name: "ACME", siren: "123456789" }, null);

		const { buildTransmittedPdfData } = await import(
			"../buildTransmittedPdfData"
		);

		await expect(
			buildTransmittedPdfData("123456789", 2025, new Date()),
		).rejects.toThrow("Déclaration introuvable");
	});

	it("returns null jointEvaluationFile when none exists", async () => {
		setupMockDb(
			{ name: "ACME", siren: "123456789" },
			{ id: "decl-1", year: 2025 },
			[],
			[],
			[],
		);

		const { buildTransmittedPdfData } = await import(
			"../buildTransmittedPdfData"
		);
		const result = await buildTransmittedPdfData(
			"123456789",
			2025,
			new Date("2026-03-15"),
		);

		expect(result.opinions).toEqual([]);
		expect(result.cseFiles).toEqual([]);
		expect(result.jointEvaluationFile).toBeNull();
	});
});
