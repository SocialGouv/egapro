/**
 * Unit tests for the DB-free half of `scripts/backfill-company-naf.mjs` (#4087).
 *
 * They live outside `*.integration.test.ts` on purpose: that suffix is excluded
 * from `vitest.config.ts` and `test:integration` is wired into no CI workflow,
 * so anything placed there runs only on a developer machine with Docker up.
 * The diffusibility mask and the systemic-failure threshold are the two rules
 * whose silent regression would be most expensive — they belong in the suite CI
 * actually runs.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	fetchNaf,
	hasSystemicFailure,
} from "#scripts/backfill-company-naf.mjs";

const SIREN = "700000030";
const fetchSpy = vi.fn();

beforeEach(() => {
	fetchSpy.mockReset();
	vi.stubGlobal("fetch", fetchSpy);
});

describe("fetchNaf", () => {
	function weezResponse(entity: unknown) {
		return {
			ok: true,
			status: 200,
			json: async () => ({ content: entity === null ? [] : [entity] }),
		};
	}

	it("masks a non-diffusible unit rather than putting its activity back in the clear", async () => {
		fetchSpy.mockResolvedValue(
			weezResponse({
				statutdiffusionunitelegale: "N",
				activiteprincipaleunitelegale: "65.12Z",
				nomenclatureactiviteprincipalelibelleunitelegale: "Autres assurances",
			}),
		);

		expect(await fetchNaf("https://registry.test", SIREN)).toBeNull();
	});

	it("clamps the label to the naf_label column width", async () => {
		const long = "a".repeat(300);
		fetchSpy.mockResolvedValue(
			weezResponse({
				statutdiffusionunitelegale: "O",
				activiteprincipaleunitelegale: "65.12Z",
				nomenclatureactiviteprincipalelibelleunitelegale: long,
			}),
		);

		const naf = await fetchNaf("https://registry.test", SIREN);
		expect(naf?.nafLabel).toHaveLength(255);
	});

	it("reads the rév. 2 code, never the NAF 2025 one", async () => {
		fetchSpy.mockResolvedValue(
			weezResponse({
				statutdiffusionunitelegale: "O",
				activiteprincipaleunitelegale: "65.12Z",
				activiteprincipalenaf25unitelegale: "66.99A",
				nomenclatureactiviteprincipalelibelleunitelegale: "Autres assurances",
			}),
		);

		const naf = await fetchNaf("https://registry.test", SIREN);
		expect(naf?.nafCode).toBe("65.12Z");
	});

	it("returns null when the registry knows nothing about the siren", async () => {
		fetchSpy.mockResolvedValue(weezResponse(null));
		expect(await fetchNaf("https://registry.test", SIREN)).toBeNull();
	});
});

describe("hasSystemicFailure", () => {
	const counters = (failed: number, ok: number) => ({
		updated: ok,
		unchanged: 0,
		skipped: 0,
		failed,
		errors: [],
	});

	it("tolerates isolated failures so one timeout cannot fail a deploy", () => {
		expect(hasSystemicFailure(counters(1, 999))).toBe(false);
	});

	it("fails the run when the registry is down for nearly everything", () => {
		expect(hasSystemicFailure(counters(1000, 0))).toBe(true);
	});

	it("is false on a clean run and on an empty table", () => {
		expect(hasSystemicFailure(counters(0, 500))).toBe(false);
		expect(hasSystemicFailure(counters(0, 0))).toBe(false);
	});
});
