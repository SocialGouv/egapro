import { describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const mockWhereResult = vi.fn();

vi.mock("~/server/db", () => {
	const makeChain = () => ({
		select: () => ({
			from: () => ({
				where: (...args: unknown[]) =>
					Object.assign(Promise.resolve(mockWhereResult(...args)), {
						limit: mockLimit,
					}),
			}),
		}),
	});
	return { db: makeChain() };
});

vi.mock("~/server/db/schema", () => ({
	declarations: { siren: "siren", year: "year" },
	declarationCategories: {
		siren: "siren",
		year: "year",
		step: "step",
	},
	companies: { siren: "siren" },
}));

vi.mock("drizzle-orm", () => ({
	and: (...args: unknown[]) => args,
	eq: (col: unknown, val: unknown) => ({ col, val }),
}));

describe("buildPdfData", () => {
	it("throws when declaration not found", async () => {
		mockLimit.mockResolvedValueOnce([]);

		const { buildPdfData } = await import("../buildPdfData");
		await expect(buildPdfData("123456789", 2026)).rejects.toThrow(
			"Déclaration introuvable",
		);
	});

	it("throws when declaration is not submitted", async () => {
		mockLimit.mockResolvedValueOnce([
			{ siren: "123456789", year: 2026, status: "draft" },
		]);

		const { buildPdfData } = await import("../buildPdfData");
		await expect(buildPdfData("123456789", 2026)).rejects.toThrow(
			"La déclaration n'est pas encore soumise",
		);
	});
});
