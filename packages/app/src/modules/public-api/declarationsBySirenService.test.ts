import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	dbSelect: vi.fn(),
	orderBy: vi.fn(),
	where: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: { select: mocks.dbSelect },
}));

vi.mock("~/server/db/schema", () => ({
	campaignDeadlines: { year: "cd.year", publicDataReleaseDate: "cd.release" },
	companies: { siren: "c.siren" },
	declarations: {
		siren: "d.siren",
		year: "d.year",
		status: "d.status",
		cancelledAt: "d.cancelledAt",
	},
	gipMdsData: { siren: "g.siren", year: "g.year", workforceEma: "g.ema" },
}));

vi.mock("drizzle-orm", () => ({
	and: (...args: unknown[]) => ({ and: args }),
	desc: (col: unknown) => ({ desc: col }),
	eq: (a: unknown, b: unknown) => ({ eq: [a, b] }),
	isNull: (col: unknown) => ({ isNull: col }),
	ne: (a: unknown, b: unknown) => ({ ne: [a, b] }),
}));

const NOW = new Date("2026-06-15T12:00:00Z");
const RELEASED_DATE = "2026-03-01";
const FUTURE_DATE = "2027-03-01";

type RawRow = Record<string, unknown>;

function makeRawRow(overrides: RawRow = {}): RawRow {
	return {
		year: 2024,
		totalWomen: 120,
		totalMen: 80,
		globalAnnualMeanGap: "12.3400",
		globalAnnualMedianGap: "10.0000",
		globalHourlyMeanGap: "8.5000",
		globalHourlyMedianGap: "7.2500",
		variableAnnualMeanGap: "5.5000",
		variableAnnualMedianGap: "4.1000",
		variableHourlyMeanGap: "3.3000",
		variableHourlyMedianGap: "2.2000",
		variableProportionWomen: "45.0000",
		variableProportionMen: "55.0000",
		annualQuartile1ProportionWomen: "60.0000",
		annualQuartile2ProportionWomen: "55.0000",
		annualQuartile3ProportionWomen: "50.0000",
		annualQuartile4ProportionWomen: "40.0000",
		annualQuartile1ProportionMen: "40.0000",
		annualQuartile2ProportionMen: "45.0000",
		annualQuartile3ProportionMen: "50.0000",
		annualQuartile4ProportionMen: "60.0000",
		hourlyQuartile1ProportionWomen: "61.0000",
		hourlyQuartile2ProportionWomen: "56.0000",
		hourlyQuartile3ProportionWomen: "51.0000",
		hourlyQuartile4ProportionWomen: "41.0000",
		hourlyQuartile1ProportionMen: "39.0000",
		hourlyQuartile2ProportionMen: "44.0000",
		hourlyQuartile3ProportionMen: "49.0000",
		hourlyQuartile4ProportionMen: "59.0000",
		companySiren: "123456789",
		companyName: "Société Démo",
		companyAddress: "1 rue de la Paix, 75002 Paris",
		companyRegion: "Île-de-France",
		companyDepartmentCode: "75",
		companyDepartmentLabel: "Paris",
		companyNafCode: "62.01Z",
		companyNafLabel: "Programmation informatique",
		workforceEma: "250.0000",
		publicDataReleaseDate: RELEASED_DATE,
		...overrides,
	};
}

function setRows(rows: RawRow[]) {
	mocks.orderBy.mockResolvedValue(rows);
}

async function importService() {
	return import("./declarationsBySirenService");
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
	mocks.orderBy.mockReset();
	mocks.where.mockReset();
	mocks.where.mockReturnValue({ orderBy: mocks.orderBy });
	mocks.dbSelect.mockReturnValue({
		from: () => ({
			innerJoin: () => ({
				leftJoin: () => ({
					leftJoin: () => ({ where: mocks.where }),
				}),
			}),
		}),
	});
});

afterEach(() => {
	vi.useRealTimers();
});

describe("getPublicDeclarationsBySiren", () => {
	it("returns projected DTOs for released declarations", async () => {
		setRows([makeRawRow()]);
		const { getPublicDeclarationsBySiren } = await importService();

		const result = await getPublicDeclarationsBySiren("123456789");

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			siren: "123456789",
			year: 2024,
			name: "Société Démo",
			workforceEma: 250,
			globalAnnualMeanGap: 12.34,
		});
	});

	it("filters out declarations whose year is not yet publicly released", async () => {
		setRows([
			makeRawRow({ year: 2024, publicDataReleaseDate: RELEASED_DATE }),
			makeRawRow({ year: 2025, publicDataReleaseDate: FUTURE_DATE }),
			makeRawRow({ year: 2023, publicDataReleaseDate: null }),
		]);
		const { getPublicDeclarationsBySiren } = await importService();

		const result = await getPublicDeclarationsBySiren("123456789");

		expect(result.map((d) => d.year)).toEqual([2024]);
	});

	it("applies the limit after the release filter", async () => {
		setRows([
			makeRawRow({ year: 2024 }),
			makeRawRow({ year: 2023 }),
			makeRawRow({ year: 2022 }),
		]);
		const { getPublicDeclarationsBySiren } = await importService();

		const result = await getPublicDeclarationsBySiren("123456789", 2);

		expect(result.map((d) => d.year)).toEqual([2024, 2023]);
	});

	it("returns an empty array when no declaration exists for the siren", async () => {
		setRows([]);
		const { getPublicDeclarationsBySiren } = await importService();

		const result = await getPublicDeclarationsBySiren("123456789");

		expect(result).toEqual([]);
	});

	it("masks company identity when the address proxy is null (non-diffusible)", async () => {
		setRows([makeRawRow({ companyAddress: null })]);
		const { getPublicDeclarationsBySiren } = await importService();

		const result = await getPublicDeclarationsBySiren("123456789");

		expect(result[0]).toMatchObject({
			siren: "123456789",
			name: null,
			address: null,
			region: null,
			nafCode: null,
		});
	});

	it("coerces nullable join columns to null", async () => {
		setRows([
			makeRawRow({
				companyRegion: null,
				companyDepartmentCode: null,
				companyDepartmentLabel: null,
				companyNafCode: null,
				companyNafLabel: null,
				workforceEma: null,
			}),
		]);
		const { getPublicDeclarationsBySiren } = await importService();

		const result = await getPublicDeclarationsBySiren("123456789");

		expect(result[0]).toMatchObject({
			region: null,
			departmentCode: null,
			nafCode: null,
			workforceEma: null,
		});
	});
});

describe("getPublicDeclarationBySirenYear", () => {
	it("returns the projected DTO for a released declaration", async () => {
		setRows([makeRawRow({ year: 2024 })]);
		const { getPublicDeclarationBySirenYear } = await importService();

		const result = await getPublicDeclarationBySirenYear("123456789", 2024);

		expect(result).toMatchObject({ siren: "123456789", year: 2024 });
	});

	it("returns null when the declaration does not exist", async () => {
		setRows([]);
		const { getPublicDeclarationBySirenYear } = await importService();

		const result = await getPublicDeclarationBySirenYear("123456789", 2024);

		expect(result).toBeNull();
	});

	it("returns null when the declaration exists but is not yet released", async () => {
		setRows([makeRawRow({ year: 2025, publicDataReleaseDate: FUTURE_DATE })]);
		const { getPublicDeclarationBySirenYear } = await importService();

		const result = await getPublicDeclarationBySirenYear("123456789", 2025);

		expect(result).toBeNull();
	});

	it("returns null when the year has no release date set", async () => {
		setRows([makeRawRow({ year: 2023, publicDataReleaseDate: null })]);
		const { getPublicDeclarationBySirenYear } = await importService();

		const result = await getPublicDeclarationBySirenYear("123456789", 2023);

		expect(result).toBeNull();
	});
});
