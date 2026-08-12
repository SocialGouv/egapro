import { describe, expect, it } from "vitest";
import {
	computeReferencePeriodStart,
	formatReport,
	mapCompanyFromV1,
	mapDeclarationFromV1,
	parseCliArgs,
} from "#scripts/import-v1-representation.mjs";
import {
	v1Company,
	v1Data,
	v1Indicator,
	v1Row,
} from "~/test/v1RepresentationFixtures";

const NOW = new Date("2024-03-15T10:00:00.000Z");

describe("parseCliArgs", () => {
	it("rejects a missing --from", () => {
		expect(() => parseCliArgs([], { now: NOW })).toThrow("--from is required");
	});

	it("rejects a --from flag left without a value", () => {
		expect(() => parseCliArgs(["--dry-run"], { now: NOW })).toThrow(
			"--from is required",
		);
	});

	it("defaults --to to the injected clock and --dry-run to false", () => {
		const { from, to, dryRun } = parseCliArgs(["--from", "2023-01-01"], {
			now: NOW,
		});

		expect(from.toISOString()).toBe("2023-01-01T00:00:00.000Z");
		expect(to).toBe(NOW);
		expect(dryRun).toBe(false);
	});

	it("defaults the clock to the current date when none is injected", () => {
		const before = Date.now();

		const { to } = parseCliArgs(["--from", "2023-01-01"]);

		expect(to.getTime()).toBeGreaterThanOrEqual(before);
	});

	it("parses an explicit range and the dry-run flag in any order", () => {
		const { from, to, dryRun } = parseCliArgs(
			["--dry-run", "--to", "2024-01-01", "--from", "2023-01-01"],
			{ now: NOW },
		);

		expect(from.toISOString()).toBe("2023-01-01T00:00:00.000Z");
		expect(to.toISOString()).toBe("2024-01-01T00:00:00.000Z");
		expect(dryRun).toBe(true);
	});

	it("ignores unknown tokens", () => {
		const { from, dryRun } = parseCliArgs(
			["--verbose", "--from", "2023-01-01"],
			{ now: NOW },
		);

		expect(from.toISOString()).toBe("2023-01-01T00:00:00.000Z");
		expect(dryRun).toBe(false);
	});

	it.each([
		["--from", ["--from", "01/01/2023"]],
		["--to", ["--from", "2023-01-01", "--to", "2023/12/31"]],
	])("rejects a malformed %s date", (label, argv) => {
		expect(() => parseCliArgs(argv, { now: NOW })).toThrow(
			`Invalid ${label} date`,
		);
	});

	it("rejects a well-formed but non-existent date", () => {
		expect(() => parseCliArgs(["--from", "2023-13-01"], { now: NOW })).toThrow(
			'Invalid --from date "2023-13-01"',
		);
	});

	it.each([
		["equal to", "2023-01-01"],
		["before", "2022-12-31"],
	])("rejects a --to %s --from", (_label, to) => {
		expect(() =>
			parseCliArgs(["--from", "2023-01-01", "--to", to], { now: NOW }),
		).toThrow(`--to (${to}) must be after --from (2023-01-01)`);
	});

	it("rejects a --from in the future of the default clock", () => {
		expect(() => parseCliArgs(["--from", "2999-01-01"], { now: NOW })).toThrow(
			"--to (now) must be after --from (2999-01-01)",
		);
	});
});

describe("computeReferencePeriodStart", () => {
	it.each([
		["a calendar year", "2023-12-31", "2023-01-01"],
		["a mid-year fiscal period", "2024-06-30", "2023-07-01"],
		["a first-of-month end", "2023-03-01", "2022-03-02"],
		["a leap year", "2024-12-31", "2024-01-01"],
		["a period spanning a 29th of February", "2024-02-28", "2023-03-01"],
	])("derives the start of %s", (_label, end, expected) => {
		expect(computeReferencePeriodStart(end)).toBe(expected);
	});
});

describe("mapCompanyFromV1", () => {
	it("maps a fully documented V1 company", () => {
		expect(mapCompanyFromV1(v1Company())).toEqual({
			siren: "123456789",
			name: "Société Démo",
			address: "1 rue de la Paix",
			nafCode: "62.01Z",
			region: "Île-de-France",
			departmentCode: "75",
			departmentLabel: "Paris",
		});
	});

	it("resolves Corsican codes", () => {
		const company = mapCompanyFromV1(
			v1Company({ région: "94", département: "2A" }),
		);

		expect(company.region).toBe("Corse");
		expect(company.departmentLabel).toBe("Corse-du-Sud");
	});

	it.each([
		["the non-diffusible sentinel", "[NON-DIFFUSIBLE]"],
		["an absent code", undefined],
	])("nulls the NAF code for %s", (_label, codeNaf) => {
		expect(
			mapCompanyFromV1(v1Company({ code_naf: codeNaf })).nafCode,
		).toBeNull();
	});

	it("nulls every optional field absent from V1", () => {
		expect(
			mapCompanyFromV1({
				siren: "123456789",
				raison_sociale: "Société Démo",
			}),
		).toEqual({
			siren: "123456789",
			name: "Société Démo",
			address: null,
			nafCode: null,
			region: null,
			departmentCode: null,
			departmentLabel: null,
		});
	});

	it("keeps an unknown department code but nulls the labels it cannot resolve", () => {
		expect(
			mapCompanyFromV1(v1Company({ région: "99", département: "999" })),
		).toMatchObject({
			region: null,
			departmentCode: "999",
			departmentLabel: null,
		});
	});
});

describe("mapDeclarationFromV1", () => {
	it("maps a computable declaration published by URL", () => {
		expect(mapDeclarationFromV1(v1Row())).toEqual({
			siren: "123456789",
			year: 2023,
			legacyDeclarant: {
				email: "declarant@example.fr",
				lastname: "Martin",
				firstname: "Camille",
				phone: "0102030405",
			},
			referencePeriodStart: "2023-01-01",
			referencePeriodEnd: "2023-12-31",
			executiveWomenPercent: 45,
			executiveMenPercent: 55,
			notComputableReasonExecutives: null,
			memberWomenPercent: 40,
			memberMenPercent: 60,
			notComputableReasonMembers: null,
			publishDate: "2024-02-01",
			publishUrl: "https://example.fr/representation",
			publishModalities: null,
			submittedAt: new Date("2024-02-10T09:30:00.000Z"),
			createdAt: new Date("2024-02-10T09:30:00.000Z"),
			updatedAt: new Date("2024-02-11T14:45:00.000Z"),
		});
	});

	it("takes the year from the V1 row column", () => {
		expect(mapDeclarationFromV1(v1Row({ year: 2022 })).year).toBe(2022);
	});

	it.each([
		"aucun_cadre_dirigeant",
		"un_seul_cadre_dirigeant",
	])("drops the executive percentages when the reason is %s", (reason) => {
		const row = v1Row({
			data: v1Data({
				indicateurs: {
					représentation_équilibrée: v1Indicator({
						motif_non_calculabilité_cadres: reason,
					}),
				},
			}),
		});

		expect(mapDeclarationFromV1(row)).toMatchObject({
			executiveWomenPercent: null,
			executiveMenPercent: null,
			notComputableReasonExecutives: reason,
			memberWomenPercent: 40,
			memberMenPercent: 60,
			notComputableReasonMembers: null,
		});
	});

	it("drops the member percentages when the governing body is missing", () => {
		const row = v1Row({
			data: v1Data({
				indicateurs: {
					représentation_équilibrée: v1Indicator({
						motif_non_calculabilité_membres: "aucune_instance_dirigeante",
					}),
				},
			}),
		});

		expect(mapDeclarationFromV1(row)).toMatchObject({
			executiveWomenPercent: 45,
			executiveMenPercent: 55,
			notComputableReasonExecutives: null,
			memberWomenPercent: null,
			memberMenPercent: null,
			notComputableReasonMembers: "aucune_instance_dirigeante",
		});
	});

	it("keeps a zero percentage instead of nulling it", () => {
		const row = v1Row({
			data: v1Data({
				indicateurs: {
					représentation_équilibrée: v1Indicator({
						pourcentage_femmes_cadres: 0,
						pourcentage_hommes_cadres: 100,
					}),
				},
			}),
		});

		expect(mapDeclarationFromV1(row)).toMatchObject({
			executiveWomenPercent: 0,
			executiveMenPercent: 100,
		});
	});

	it("nulls percentages absent from a computable V1 indicator", () => {
		const row = v1Row({
			data: v1Data({ indicateurs: { représentation_équilibrée: {} } }),
		});

		expect(mapDeclarationFromV1(row)).toMatchObject({
			executiveWomenPercent: null,
			executiveMenPercent: null,
			memberWomenPercent: null,
			memberMenPercent: null,
		});
	});

	it("maps a publication described by modalities", () => {
		const row = v1Row({
			data: v1Data({
				déclaration: {
					année_indicateurs: 2023,
					fin_période_référence: "2023-12-31",
					publication: {
						date: "2024-02-01",
						modalités: "Affichage dans les locaux",
					},
				},
			}),
		});

		expect(mapDeclarationFromV1(row)).toMatchObject({
			publishDate: "2024-02-01",
			publishUrl: null,
			publishModalities: "Affichage dans les locaux",
		});
	});

	it("nulls every publication field when V1 carries no publication", () => {
		const row = v1Row({
			data: v1Data({
				déclaration: {
					année_indicateurs: 2023,
					fin_période_référence: "2023-12-31",
				},
			}),
		});

		expect(mapDeclarationFromV1(row)).toMatchObject({
			publishDate: null,
			publishUrl: null,
			publishModalities: null,
		});
	});

	it("derives the reference period start from the V1 period end", () => {
		const row = v1Row({
			data: v1Data({
				déclaration: {
					année_indicateurs: 2023,
					fin_période_référence: "2024-06-30",
				},
			}),
		});

		expect(mapDeclarationFromV1(row)).toMatchObject({
			referencePeriodStart: "2023-07-01",
			referencePeriodEnd: "2024-06-30",
		});
	});
});

describe("formatReport", () => {
	const counters = {
		total: 10,
		imported: 4,
		updated: 3,
		skippedUpToDate: 2,
		skippedNative: 1,
		errors: [],
	};

	it("reports every counter without a dry-run prefix", () => {
		const report = formatReport(counters, false);

		expect(report.split("\n")[0]).toBe("import-v1-representation report");
		expect(report).toMatch(/ {2}total read: +10$/m);
		expect(report).toMatch(/ {2}imported: +4$/m);
		expect(report).toMatch(/ {2}updated: +3$/m);
		expect(report).toMatch(/ {2}skipped \(up to date\): +2$/m);
		expect(report).toMatch(/ {2}skipped \(native V2\): +1$/m);
		expect(report).toMatch(/ {2}errors: +0$/m);
	});

	it("flags a dry run in the report header", () => {
		expect(formatReport(counters, true).split("\n")[0]).toBe(
			"[dry-run] import-v1-representation report",
		);
	});

	it("lists one identified line per error and no declarant identity", () => {
		const report = formatReport(
			{
				...counters,
				errors: [
					{ siren: "123456789", year: 2023, cause: "malformed jsonb" },
					{ siren: "987654321", year: 2022, cause: "missing raison_sociale" },
				],
			},
			false,
		);

		expect(report).toMatch(/ {2}errors: +2$/m);
		expect(report).toContain(
			"    siren=123456789 year=2023 cause=malformed jsonb",
		);
		expect(report).toContain(
			"    siren=987654321 year=2022 cause=missing raison_sociale",
		);
		expect(report).not.toContain("declarant@example.fr");
	});
});
