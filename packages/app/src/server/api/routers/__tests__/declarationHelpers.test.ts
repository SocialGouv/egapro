import { describe, expect, it, vi } from "vitest";
import { declarations, gipMdsData } from "~/server/db/schema";
import { makeGipRow } from "~/test/gipGapFixtures";
import {
	activeDeclarationFilter,
	applyPercentagesAfterUpdate,
	buildEmployeeCategoryValues,
	mapToEmployeeCategoryRows,
} from "../declarationHelpers";
import { mapToStepData } from "../declarationStepMapping";

describe("activeDeclarationFilter", () => {
	it("filters siren, year, and cancelled_at IS NULL", async () => {
		const { PgDialect } = await import("drizzle-orm/pg-core");
		const dialect = new PgDialect({ casing: "snake_case" });

		const filter = activeDeclarationFilter("123456789", 2025);
		expect(filter).toBeDefined();
		const compiled = dialect.sqlToQuery(filter as never);

		expect(compiled.sql).toMatch(/"siren"\s*=\s*\$1/);
		expect(compiled.sql).toMatch(/"year"\s*=\s*\$2/);
		expect(compiled.sql).toMatch(/"cancelled_at"\s+is\s+null/i);
		expect(compiled.params).toEqual(["123456789", 2025]);
	});

	it("targets the declarations.cancelledAt column", () => {
		const filter = activeDeclarationFilter("987654321", 2030);
		expect(filter).toBeDefined();
		expect(declarations.cancelledAt).toBeDefined();
	});
});

describe("buildEmployeeCategoryValues", () => {
	it("maps all fields from data to values object", () => {
		const result = buildEmployeeCategoryValues("job-1", "initial", {
			womenCount: 10,
			menCount: 15,
			annualBaseWomen: "30000",
			annualBaseMen: "32000",
			annualVariableWomen: "5000",
			annualVariableMen: "6000",
			hourlyBaseWomen: "18.5",
			hourlyBaseMen: "19.0",
			hourlyVariableWomen: "3.0",
			hourlyVariableMen: "3.5",
		});

		expect(result).toEqual({
			jobCategoryId: "job-1",
			declarationType: "initial",
			womenCount: 10,
			menCount: 15,
			annualBaseWomen: "30000",
			annualBaseMen: "32000",
			annualVariableWomen: "5000",
			annualVariableMen: "6000",
			hourlyBaseWomen: "18.5",
			hourlyBaseMen: "19.0",
			hourlyVariableWomen: "3.0",
			hourlyVariableMen: "3.5",
		});
	});

	it("defaults missing fields to null", () => {
		const result = buildEmployeeCategoryValues("job-1", "correction", {});

		expect(result).toEqual({
			jobCategoryId: "job-1",
			declarationType: "correction",
			womenCount: null,
			menCount: null,
			annualBaseWomen: null,
			annualBaseMen: null,
			annualVariableWomen: null,
			annualVariableMen: null,
			hourlyBaseWomen: null,
			hourlyBaseMen: null,
			hourlyVariableWomen: null,
			hourlyVariableMen: null,
		});
	});

	it("handles partial data correctly", () => {
		const result = buildEmployeeCategoryValues("job-2", "initial", {
			womenCount: 5,
			annualBaseWomen: "25000",
		});

		expect(result.womenCount).toBe(5);
		expect(result.annualBaseWomen).toBe("25000");
		expect(result.menCount).toBeNull();
		expect(result.annualBaseMen).toBeNull();
	});
});

describe("mapToEmployeeCategoryRows", () => {
	const baseJob = {
		id: "job-1",
		declarationId: "decl-1",
		categoryIndex: 0,
		name: "Cadres",
		source: "dads",
		createdAt: new Date(),
	};

	const baseEmpCat = {
		id: "emp-1",
		jobCategoryId: "job-1",
		declarationType: "initial" as const,
		womenCount: 10,
		menCount: 15,
		annualBaseWomen: "30000",
		annualBaseMen: "32000",
		annualVariableWomen: null,
		annualVariableMen: null,
		hourlyBaseWomen: null,
		hourlyBaseMen: null,
		hourlyVariableWomen: null,
		hourlyVariableMen: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	it("maps jobs and employee categories into rows sorted by categoryIndex", () => {
		const jobs = [
			{ ...baseJob, id: "job-2", categoryIndex: 1, name: "Employés" },
			{ ...baseJob, id: "job-1", categoryIndex: 0, name: "Cadres" },
		];

		const empCats = [
			{ ...baseEmpCat, jobCategoryId: "job-1" },
			{
				...baseEmpCat,
				id: "emp-2",
				jobCategoryId: "job-2",
				womenCount: 20,
				menCount: 25,
			},
		];

		const result = mapToEmployeeCategoryRows(jobs, empCats, "initial");

		expect(result).toHaveLength(2);
		expect(result[0]?.name).toBe("Cadres");
		expect(result[0]?.womenCount).toBe(10);
		expect(result[1]?.name).toBe("Employés");
		expect(result[1]?.womenCount).toBe(20);
	});

	it("returns null fields when no employee category matches", () => {
		const jobs = [baseJob];
		const result = mapToEmployeeCategoryRows(jobs, [], "initial");

		expect(result).toHaveLength(1);
		expect(result[0]?.womenCount).toBeNull();
		expect(result[0]?.menCount).toBeNull();
	});

	it("filters by declaration type", () => {
		const jobs = [baseJob];
		const empCats = [
			{ ...baseEmpCat, declarationType: "correction" as const, womenCount: 99 },
		];

		const result = mapToEmployeeCategoryRows(jobs, empCats, "initial");

		expect(result[0]?.womenCount).toBeNull();
	});
});

describe("fetchAllCategories", () => {
	it("returns jobCategories and employeeCategories", async () => {
		const { fetchAllCategories } = await import("../declarationHelpers");

		const mockJobs = [{ id: "job-1" }, { id: "job-2" }];
		const mockEmpCats = [
			[{ id: "emp-1", jobCategoryId: "job-1" }],
			[{ id: "emp-2", jobCategoryId: "job-2" }],
		];

		let selectCallCount = 0;
		const mockSelectWhere = vi.fn().mockImplementation(() => {
			selectCallCount++;
			if (selectCallCount === 1) return Promise.resolve(mockJobs);
			// Employee category queries (one per job)
			return Promise.resolve(mockEmpCats[selectCallCount - 2] ?? []);
		});
		const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

		const tx = { select: mockSelect } as never;

		const result = await fetchAllCategories(tx, "decl-1");

		expect(result.jobCategories).toEqual(mockJobs);
		expect(result.employeeCategories).toHaveLength(2);
	});

	it("returns empty employeeCategories when no jobs exist", async () => {
		const { fetchAllCategories } = await import("../declarationHelpers");

		const mockSelectWhere = vi.fn().mockImplementation(() => {
			return Promise.resolve([]);
		});
		const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

		const tx = { select: mockSelect } as never;

		const result = await fetchAllCategories(tx, "decl-1");

		expect(result.jobCategories).toEqual([]);
		expect(result.employeeCategories).toEqual([]);
	});
});

describe("fetchPreviousYearJobCategories", () => {
	type JobCategoryRow = {
		name: string;
		source: string;
		categoryIndex: number;
	};

	/**
	 * Build a mocked `tx` with two select chains:
	 *   1. declarations probe (innerJoin jobCategories, limit 1) → id or nothing
	 *   2. jobCategories fetch for that id → rows
	 *
	 * Each chain resolves at its terminal call (`.limit()` / `.where()`), so
	 * the mock is driven by the data the query is expected to return, not by
	 * internal call-order counters.
	 */
	const makeTx = (
		declarationId: string | null,
		jobs: JobCategoryRow[] = [],
	) => {
		const declarationChain = {
			from: () => ({
				innerJoin: () => ({
					where: () => ({
						orderBy: () => ({
							limit: () =>
								Promise.resolve(declarationId ? [{ id: declarationId }] : []),
						}),
					}),
				}),
			}),
		};

		const jobCategoriesChain = {
			from: () => ({
				where: () => Promise.resolve(jobs),
			}),
		};

		const queue = [declarationChain, jobCategoriesChain];
		return { select: () => queue.shift() } as never;
	};

	it("returns null when no previous declaration contains indicator 7", async () => {
		const { fetchPreviousYearJobCategories } = await import(
			"../declarationHelpers"
		);

		const result = await fetchPreviousYearJobCategories(
			makeTx(null),
			"123456789",
			2026,
		);

		expect(result).toBeNull();
	});

	it("returns categories from the most recent qualifying declaration", async () => {
		const { fetchPreviousYearJobCategories } = await import(
			"../declarationHelpers"
		);

		const tx = makeTx("decl-2024", [
			{
				name: "Employés",
				source: "accord-entreprise",
				categoryIndex: 1,
			},
			{
				name: "Cadres",
				source: "accord-entreprise",
				categoryIndex: 0,
			},
		]);

		const result = await fetchPreviousYearJobCategories(tx, "123456789", 2026);

		expect(result).toEqual({
			source: "accord-entreprise",
			categories: [{ name: "Cadres" }, { name: "Employés" }],
		});
	});
});

describe("deleteJobAndEmployeeCategories", () => {
	it("deletes employee categories then job categories", async () => {
		const { deleteJobAndEmployeeCategories } = await import(
			"../declarationHelpers"
		);

		const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
		const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });
		const mockSelectWhere = vi
			.fn()
			.mockResolvedValue([{ id: "job-1" }, { id: "job-2" }]);
		const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

		const tx = { select: mockSelect, delete: mockDelete } as never;

		await deleteJobAndEmployeeCategories(tx, "decl-1");

		// 2 employee category deletes + 1 job categories delete = 3 total
		expect(mockDelete).toHaveBeenCalledTimes(3);
	});

	it("does not delete job categories when none exist", async () => {
		const { deleteJobAndEmployeeCategories } = await import(
			"../declarationHelpers"
		);

		const mockDelete = vi.fn();
		const mockSelectWhere = vi.fn().mockResolvedValue([]);
		const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

		const tx = { select: mockSelect, delete: mockDelete } as never;

		await deleteJobAndEmployeeCategories(tx, "decl-1");

		expect(mockDelete).not.toHaveBeenCalled();
	});
});

describe("applyPercentagesAfterUpdate", () => {
	const declarationRow = {
		indicatorAAnnualWomen: "100",
		indicatorAAnnualMen: "110",
		indicatorAHourlyWomen: "20",
		indicatorAHourlyMen: "22",
		indicatorBAnnualWomen: "50",
		indicatorBAnnualMen: "55",
		indicatorBHourlyWomen: "10",
		indicatorBHourlyMen: "11",
		indicatorCAnnualWomen: "95",
		indicatorCAnnualMen: "105",
		indicatorCHourlyWomen: "18",
		indicatorCHourlyMen: "20",
		indicatorDAnnualWomen: "45",
		indicatorDAnnualMen: "50",
		indicatorDHourlyWomen: "9",
		indicatorDHourlyMen: "10",
	};

	/**
	 * A tx whose `select()` dispatches on the table handed to `from()`, so the
	 * declaration and GIP reads are driven by the data each returns rather than
	 * by call order.
	 */
	function makeTx(gipRows: unknown[]) {
		const set = vi
			.fn()
			.mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
		const tx = {
			select: () => ({
				from: (table: unknown) => ({
					where: () => ({
						limit: () =>
							Promise.resolve(
								table === gipMdsData ? gipRows : [declarationRow],
							),
					}),
				}),
			}),
			update: () => ({ set }),
		};
		return { tx, set };
	}

	it("persists the GIP gaps when a GIP row exists for the siren and year", async () => {
		const { tx, set } = makeTx([
			makeGipRow({
				globalAnnualMeanWomen: "100",
				globalAnnualMeanMen: "110",
				globalAnnualMeanGap: "0.4242",
			}),
		]);

		await applyPercentagesAfterUpdate(tx as never, "123456789", 2025);

		expect(set).toHaveBeenCalledTimes(1);
		expect(set.mock.calls[0]?.[0]).toMatchObject({
			globalAnnualMeanGap: "0.4242",
		});
	});

	it("recomputes every gap when the siren has no GIP row", async () => {
		const { tx, set } = makeTx([]);

		await applyPercentagesAfterUpdate(tx as never, "123456789", 2025);

		expect(set.mock.calls[0]?.[0]).toMatchObject({
			globalAnnualMeanGap: ((110 - 100) / 110).toString(),
		});
	});

	it("writes nothing when the declaration no longer exists", async () => {
		const set = vi.fn();
		const tx = {
			select: () => ({
				from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
			}),
			update: () => ({ set }),
		};

		await applyPercentagesAfterUpdate(tx as never, "123456789", 2025);

		expect(set).not.toHaveBeenCalled();
	});
});

describe("mapToStepData", () => {
	// All raw declaration fields default to null. The helper must coerce them
	// to "" for step2/step3 string values and undefined for step4 numerics.
	// `Record<string, unknown>` keeps the type spreadable while `as never` at
	// call sites lets us focus the test on the mapping rather than building a
	// full DeclarationRow.
	type IndicatorRecord = Record<string, unknown>;
	const emptyDeclaration: IndicatorRecord = {
		// only the indicator fields touched by mapToStepData need to be present;
		// `as never` lets us focus the test on the mapping rather than building a
		// full DeclarationRow shape.
		indicatorAAnnualWomen: null,
		indicatorAAnnualMen: null,
		indicatorAHourlyWomen: null,
		indicatorAHourlyMen: null,
		indicatorCAnnualWomen: null,
		indicatorCAnnualMen: null,
		indicatorCHourlyWomen: null,
		indicatorCHourlyMen: null,
		indicatorBAnnualWomen: null,
		indicatorBAnnualMen: null,
		indicatorBHourlyWomen: null,
		indicatorBHourlyMen: null,
		indicatorDAnnualWomen: null,
		indicatorDAnnualMen: null,
		indicatorDHourlyWomen: null,
		indicatorDHourlyMen: null,
		indicatorEWomen: null,
		indicatorEMen: null,
		indicatorFAnnualThreshold1: null,
		indicatorFAnnualWomen1: null,
		indicatorFAnnualMen1: null,
		indicatorFAnnualThreshold2: null,
		indicatorFAnnualWomen2: null,
		indicatorFAnnualMen2: null,
		indicatorFAnnualThreshold3: null,
		indicatorFAnnualWomen3: null,
		indicatorFAnnualMen3: null,
		indicatorFAnnualWomen4: null,
		indicatorFAnnualMen4: null,
		indicatorFHourlyThreshold1: null,
		indicatorFHourlyWomen1: null,
		indicatorFHourlyMen1: null,
		indicatorFHourlyThreshold2: null,
		indicatorFHourlyWomen2: null,
		indicatorFHourlyMen2: null,
		indicatorFHourlyThreshold3: null,
		indicatorFHourlyWomen3: null,
		indicatorFHourlyMen3: null,
		indicatorFHourlyWomen4: null,
		indicatorFHourlyMen4: null,
		globalAnnualMeanGap: null,
		globalHourlyMeanGap: null,
		globalAnnualMedianGap: null,
		globalHourlyMedianGap: null,
		variableAnnualMeanGap: null,
		variableHourlyMeanGap: null,
		variableAnnualMedianGap: null,
		variableHourlyMedianGap: null,
	};

	// Every operand and gap gets a distinct value so a mis-paired tuple entry
	// (e.g. the median gap landing on the mean row) fails instead of matching
	// a look-alike neighbour.
	const pairedDeclaration: IndicatorRecord = {
		...emptyDeclaration,
		indicatorAAnnualWomen: "1000",
		indicatorAAnnualMen: "1001",
		globalAnnualMeanGap: "0.0001",
		indicatorAHourlyWomen: "1002",
		indicatorAHourlyMen: "1003",
		globalHourlyMeanGap: "0.0002",
		indicatorCAnnualWomen: "1004",
		indicatorCAnnualMen: "1005",
		globalAnnualMedianGap: "0.0003",
		indicatorCHourlyWomen: "1006",
		indicatorCHourlyMen: "1007",
		globalHourlyMedianGap: "0.0004",
		indicatorBAnnualWomen: "2000",
		indicatorBAnnualMen: "2001",
		variableAnnualMeanGap: "0.0005",
		indicatorBHourlyWomen: "2002",
		indicatorBHourlyMen: "2003",
		variableHourlyMeanGap: "0.0006",
		indicatorDAnnualWomen: "2004",
		indicatorDAnnualMen: "2005",
		variableAnnualMedianGap: "0.0007",
		indicatorDHourlyWomen: "2006",
		indicatorDHourlyMen: "2007",
		variableHourlyMedianGap: "0.0008",
	};

	it("coerces null indicator values to empty strings for step2 / step3", () => {
		const { step2Data, step3Data } = mapToStepData(emptyDeclaration as never);

		expect(step2Data).toEqual({
			indicatorAAnnualWomen: "",
			indicatorAAnnualMen: "",
			indicatorAHourlyWomen: "",
			indicatorAHourlyMen: "",
			indicatorCAnnualWomen: "",
			indicatorCAnnualMen: "",
			indicatorCHourlyWomen: "",
			indicatorCHourlyMen: "",
		});
		expect(step3Data).toEqual({
			indicatorBAnnualWomen: "",
			indicatorBAnnualMen: "",
			indicatorBHourlyWomen: "",
			indicatorBHourlyMen: "",
			indicatorDAnnualWomen: "",
			indicatorDAnnualMen: "",
			indicatorDHourlyWomen: "",
			indicatorDHourlyMen: "",
			indicatorEWomen: "",
			indicatorEMen: "",
		});
	});

	it("coerces null F-indicator quartiles to empty threshold (Q1-Q3) / undefined (Q4) + undefined women/men", () => {
		const { step4Data } = mapToStepData(emptyDeclaration as never);

		expect(step4Data.annual).toHaveLength(4);
		expect(step4Data.hourly).toHaveLength(4);
		for (const table of [step4Data.annual, step4Data.hourly]) {
			for (const row of table.slice(0, 3)) {
				expect(row).toEqual({
					threshold: "",
					women: undefined,
					men: undefined,
				});
			}
			expect(table[3]).toEqual({
				threshold: undefined,
				women: undefined,
				men: undefined,
			});
		}
	});

	it("preserves provided indicator values verbatim", () => {
		const populated: IndicatorRecord = {
			...emptyDeclaration,
			indicatorAAnnualWomen: "12.5",
			indicatorAAnnualMen: "10.0",
			indicatorEWomen: "60",
			indicatorEMen: "40",
			indicatorFAnnualThreshold1: "30000",
			indicatorFAnnualWomen1: 5,
			indicatorFAnnualMen1: 6,
			indicatorFHourlyWomen4: 1,
			indicatorFHourlyMen4: 2,
		};

		const { step2Data, step3Data, step4Data } = mapToStepData(
			populated as never,
		);

		expect(step2Data.indicatorAAnnualWomen).toBe("12.5");
		expect(step2Data.indicatorAAnnualMen).toBe("10.0");
		expect(step3Data.indicatorEWomen).toBe("60");
		expect(step3Data.indicatorEMen).toBe("40");
		expect(step4Data.annual[0]).toEqual({
			threshold: "30000",
			women: 5,
			men: 6,
		});
		expect(step4Data.hourly[3]).toEqual({
			threshold: undefined,
			women: 1,
			men: 2,
		});
	});

	// The persisted gap must travel next to the operands it was computed from,
	// in the PAY_GAP_LABELS order: annual mean, hourly mean, annual median,
	// hourly median — step 2 carrying indicators A/C and step 3 indicators B/D.
	it("pairs each step2 gap with the indicator A/C operands of the same row", () => {
		const { step2Gaps } = mapToStepData(pairedDeclaration as never);

		expect(step2Gaps).toEqual([
			{ women: "1000", men: "1001", gap: "0.0001" },
			{ women: "1002", men: "1003", gap: "0.0002" },
			{ women: "1004", men: "1005", gap: "0.0003" },
			{ women: "1006", men: "1007", gap: "0.0004" },
		]);
	});

	it("pairs each step3 gap with the indicator B/D operands of the same row", () => {
		const { step3Gaps } = mapToStepData(pairedDeclaration as never);

		expect(step3Gaps).toEqual([
			{ women: "2000", men: "2001", gap: "0.0005" },
			{ women: "2002", men: "2003", gap: "0.0006" },
			{ women: "2004", men: "2005", gap: "0.0007" },
			{ women: "2006", men: "2007", gap: "0.0008" },
		]);
	});

	it("keeps the gap tuples at 4 entries of nulls when nothing is persisted", () => {
		const { step2Gaps, step3Gaps } = mapToStepData(emptyDeclaration as never);

		for (const gaps of [step2Gaps, step3Gaps]) {
			expect(gaps).toHaveLength(4);
			expect(gaps).toEqual([
				{ women: null, men: null, gap: null },
				{ women: null, men: null, gap: null },
				{ women: null, men: null, gap: null },
				{ women: null, men: null, gap: null },
			]);
		}
	});

	// The gap references keep the raw null, while the form data coerces to "";
	// resolving a reference off "" would silently match an empty operand.
	it("keeps the raw null operand in the gap reference where step2Data coerces to an empty string", () => {
		const { step2Data, step2Gaps } = mapToStepData(emptyDeclaration as never);

		expect(step2Data.indicatorAAnnualWomen).toBe("");
		expect(step2Gaps[0]?.women).toBeNull();
	});
});
