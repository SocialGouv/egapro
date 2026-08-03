import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const SCRIPT_PATH = resolve(APP_ROOT, "scripts/check-cahier.ts");

const {
	parseCahier,
	parseFiches,
	parseFicheScenarioKeys,
	extractSection3,
	parseCoordinates,
	findTagViolations,
	findFicheRegistryViolations,
	findCoordinateViolations,
} = await import(SCRIPT_PATH);

function writeScenariosFile(keys: string[]): string {
	const dir = mkdtempSync(join(tmpdir(), "check-cahier-test-"));
	const path = join(dir, "scenarios.ts");
	const entries = keys
		.map((k) => `\t"${k}": async ({ page }) => {},`)
		.join("\n");
	writeFileSync(
		path,
		`export const FICHE_SCENARIOS = {\n${entries}\n} as const;\n`,
	);
	return path;
}

describe("parseCahier", () => {
	it("collects scenario ids from headings and table first cells", () => {
		const markdown = [
			"### CAS-01 : sans CSE",
			"| CAS-02 | desc |",
			"| ANX-01 | desc | file |",
			"## ANX-04 heading",
		].join("\n");
		expect(parseCahier(markdown)).toEqual(
			new Set(["CAS-01", "CAS-02", "ANX-01", "ANX-04"]),
		);
	});

	it("keeps suffixed variants distinct", () => {
		const markdown = ["### CAS-01 : x", "### CAS-01-6IND : y"].join("\n");
		expect(parseCahier(markdown)).toEqual(new Set(["CAS-01", "CAS-01-6IND"]));
	});

	it("throws on a duplicate scenario id", () => {
		const markdown = ["### CAS-01 : first", "| CAS-01 | second |"].join("\n");
		expect(() => parseCahier(markdown)).toThrow(/CAS-01/);
	});

	it("ignores scenario ids appearing only in prose", () => {
		expect(parseCahier("un rappel de CAS-05 dans le texte")).toEqual(new Set());
	});
});

describe("parseFiches", () => {
	it("keeps only CAS headings and drops ANX and table cells", () => {
		const markdown = [
			"### CAS-01 : x",
			"### CAS-01-6IND : y",
			"## ANX-04 heading",
			"| CAS-99 | table cell |",
			"| ANX-01 | table cell |",
		].join("\n");
		expect(parseFiches(markdown)).toEqual(new Set(["CAS-01", "CAS-01-6IND"]));
	});
});

describe("parseFicheScenarioKeys", () => {
	it("extracts CAS keys from a FICHE_SCENARIOS object", () => {
		const path = writeScenariosFile(["CAS-01", "CAS-01-6IND", "CAS-14"]);
		expect(parseFicheScenarioKeys(path)).toEqual(
			new Set(["CAS-01", "CAS-01-6IND", "CAS-14"]),
		);
	});

	it("ignores ANX keys", () => {
		const path = writeScenariosFile(["CAS-01", "ANX-01"]);
		expect(parseFicheScenarioKeys(path)).toEqual(new Set(["CAS-01"]));
	});
});

describe("extractSection3", () => {
	it("extracts the text between the §3 and §4 headings", () => {
		const markdown = [
			"## 2. Fiches",
			"contenu 2",
			"## 3. Feuilles",
			"contenu 3",
			"## 4. Complémentaires",
			"contenu 4",
		].join("\n");
		const section3 = extractSection3(markdown);
		expect(section3).toContain("## 3. Feuilles");
		expect(section3).toContain("contenu 3");
		expect(section3).not.toContain("## 4.");
		expect(section3).not.toContain("contenu 4");
		expect(section3).not.toContain("contenu 2");
	});

	it("returns everything from §3 onward when §4 is absent", () => {
		const markdown = ["## 3. Feuilles", "contenu 3"].join("\n");
		expect(extractSection3(markdown)).toContain("contenu 3");
	});

	it("throws when the §3 heading is missing", () => {
		expect(() => extractSection3("## 2. Fiches\ncontenu")).toThrow(/§3/);
	});
});

describe("parseCoordinates", () => {
	it("recognizes every EFFMAX tranche, 20xx years and two-digit CAS", () => {
		const section3 = [
			"2027-49-CAS13",
			"2028-99-CAS01",
			"2030-149-CAS02",
			"2027-249-CAS04",
			"2027-250P-CAS14",
		].join("\n");
		expect(parseCoordinates(section3)).toEqual(
			new Set([
				"2027-49-CAS13",
				"2028-99-CAS01",
				"2030-149-CAS02",
				"2027-249-CAS04",
				"2027-250P-CAS14",
			]),
		);
	});

	it("collects coordinates embedded in a cell alongside markdown links", () => {
		const section3 =
			"[2027-49-CAS13](#cas-13) : aucun écart<br>[2027-49-CAS14](#cas-14) : écart";
		expect(parseCoordinates(section3)).toEqual(
			new Set(["2027-49-CAS13", "2027-49-CAS14"]),
		);
	});

	it("does not extract fiche ids written with a dash", () => {
		expect(parseCoordinates("voir CAS-01 et 2027-249-CAS-04")).toEqual(
			new Set(),
		);
	});

	it("ignores non-20xx years and invalid tranches", () => {
		expect(parseCoordinates("1999-49-CAS01 et 2027-300-CAS01")).toEqual(
			new Set(),
		);
	});
});

describe("findTagViolations", () => {
	it("returns no violation when scenarios and tags are in bijection", () => {
		const scenarios = new Set(["CAS-01", "ANX-01"]);
		const tags = new Map([
			["CAS-01", new Set(["a.e2e.ts"])],
			["ANX-01", new Set(["b.e2e.ts"])],
		]);
		expect(findTagViolations(scenarios, tags)).toEqual([]);
	});

	it("flags a scenario declared in the cahier without an E2E tag", () => {
		const violations = findTagViolations(
			new Set(["CAS-01", "CAS-02"]),
			new Map([["CAS-01", new Set(["a.e2e.ts"])]]),
		);
		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain("CAS-02");
	});

	it("flags an E2E tag with no matching scenario in the cahier", () => {
		const violations = findTagViolations(
			new Set(["CAS-01"]),
			new Map([
				["CAS-01", new Set(["a.e2e.ts"])],
				["CAS-99", new Set(["b.e2e.ts"])],
			]),
		);
		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain("CAS-99");
		expect(violations[0]).toContain("b.e2e.ts");
	});
});

describe("findFicheRegistryViolations", () => {
	it("returns no violation when fiches and registry keys are in bijection", () => {
		const fiches = new Set(["CAS-01", "CAS-02"]);
		expect(findFicheRegistryViolations(fiches, new Set(fiches))).toEqual([]);
	});

	it("flags a fiche absent from FICHE_SCENARIOS", () => {
		const violations = findFicheRegistryViolations(
			new Set(["CAS-01", "CAS-02"]),
			new Set(["CAS-01"]),
		);
		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain("CAS-02");
		expect(violations[0]).toContain("FICHE_SCENARIOS");
	});

	it("flags a registry entry without a matching fiche", () => {
		const violations = findFicheRegistryViolations(
			new Set(["CAS-01"]),
			new Set(["CAS-01", "CAS-99"]),
		);
		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain("CAS-99");
	});
});

describe("findCoordinateViolations", () => {
	it("returns no violation when §3 coordinates match the derived grid", () => {
		const coords = new Set(["2027-49-CAS13", "2027-49-CAS14"]);
		expect(findCoordinateViolations(coords, new Set(coords))).toEqual([]);
	});

	it("flags a §3 coordinate the grid does not produce", () => {
		const violations = findCoordinateViolations(
			new Set(["2027-49-CAS13", "2027-49-CAS14"]),
			new Set(["2027-49-CAS13"]),
		);
		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain("2027-49-CAS14");
		expect(violations[0]).toContain("§3");
	});

	it("flags a grid coordinate absent from §3", () => {
		const violations = findCoordinateViolations(
			new Set(["2027-49-CAS13"]),
			new Set(["2027-49-CAS13", "2027-49-CAS14"]),
		);
		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain("2027-49-CAS14");
		expect(violations[0]).toContain("buildGrid()");
	});
});

describe("check-cahier.ts script", () => {
	it("runs without error against the real cahier, fiches and grid", async () => {
		await expect(import(SCRIPT_PATH)).resolves.toBeDefined();
	});
});
