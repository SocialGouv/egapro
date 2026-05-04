import { describe, expect, it, vi } from "vitest";

import {
	buildEmployeeCategoryValues,
	mapToEmployeeCategoryRows,
	mapToStepData,
} from "../declarationHelpers";

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
		indicatorFAnnualThreshold4: null,
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
		indicatorFHourlyThreshold4: null,
		indicatorFHourlyWomen4: null,
		indicatorFHourlyMen4: null,
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

	it("coerces null F-indicator quartiles to empty threshold + undefined women/men", () => {
		const { step4Data } = mapToStepData(emptyDeclaration as never);

		expect(step4Data.annual).toHaveLength(4);
		expect(step4Data.hourly).toHaveLength(4);
		for (const row of [...step4Data.annual, ...step4Data.hourly]) {
			expect(row).toEqual({
				threshold: "",
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
			indicatorFHourlyThreshold4: "80000",
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
			threshold: "80000",
			women: 1,
			men: 2,
		});
	});
});
