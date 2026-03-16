import { describe, expect, it, vi } from "vitest";

import {
	buildEmployeeCategoryValues,
	mapToEmployeeCategoryRows,
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
		detail: "Senior",
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

	it("uses empty string for null detail", () => {
		const jobs = [{ ...baseJob, detail: null }];

		const result = mapToEmployeeCategoryRows(jobs, [], "initial");

		expect(result[0]?.detail).toBe("");
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
