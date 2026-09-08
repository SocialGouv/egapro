import { describe, expect, it } from "vitest";
import { formatReport, parseCliArgs } from "#scripts/import-v1-referents.mjs";
import {
	mapReferentFromV1,
	mapReferentSnapshotFromV1,
} from "#scripts/import-v1-referents-mapping.mjs";

const REFERENT_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_REFERENT_ID = "22222222-2222-4222-8222-222222222222";

function v1Referent(overrides: Record<string, unknown> = {}) {
	return {
		id: REFERENT_ID,
		county: "75",
		name: "Cellule égalité professionnelle",
		principal: true,
		region: "11",
		type: "email",
		value: "referent@example.fr",
		substitute_name: "Suppléance régionale",
		substitute_email: "substitute@example.fr",
		...overrides,
	};
}

describe("parseCliArgs", () => {
	it("defaults to a real import", () => {
		expect(parseCliArgs([])).toEqual({ dryRun: false });
	});

	it("enables dry-run", () => {
		expect(parseCliArgs(["--dry-run"])).toEqual({ dryRun: true });
	});

	it("rejects unknown arguments without echoing them", () => {
		const unknownArgument = "--contains-sensitive-value";

		expect(() => parseCliArgs([unknownArgument])).toThrow(
			"Unknown argument. Usage: import-v1-referents [--dry-run]",
		);
		expect(() => parseCliArgs([unknownArgument])).not.toThrow(unknownArgument);
	});
});

describe("mapReferentFromV1", () => {
	it("maps an email referent and its substitute", () => {
		expect(mapReferentFromV1(v1Referent())).toEqual({
			id: REFERENT_ID,
			county: "75",
			name: "Cellule égalité professionnelle",
			principal: true,
			region: "11",
			type: "email",
			value: "referent@example.fr",
			substituteName: "Suppléance régionale",
			substituteEmail: "substitute@example.fr",
		});
	});

	it("maps a regional URL referent with nullable fields", () => {
		expect(
			mapReferentFromV1(
				v1Referent({
					county: null,
					principal: false,
					type: "url",
					value: "https://travail.gouv.fr/contact",
					substitute_name: null,
					substitute_email: null,
				}),
			),
		).toMatchObject({
			county: null,
			principal: false,
			type: "url",
			value: "https://travail.gouv.fr/contact",
			substituteName: null,
			substituteEmail: null,
		});
	});

	it.each([
		["id", { id: "not-a-uuid" }],
		["region", { region: "invalid-region" }],
		["county", { county: "999" }],
		["name", { name: "" }],
		["type", { type: "phone" }],
		["email value", { value: "not-an-email" }],
		["substitute email", { substitute_email: "not-an-email" }],
	])("rejects an invalid %s", (_label, overrides) => {
		expect(() => mapReferentFromV1(v1Referent(overrides))).toThrow(
			"Invalid legacy referent row",
		);
	});

	it("rejects an invalid URL value", () => {
		expect(() =>
			mapReferentFromV1(v1Referent({ type: "url", value: "not-a-url" })),
		).toThrow("Invalid legacy referent row");
	});

	it.each([
		["name", { name: "n".repeat(256) }],
		["value", { type: "url", value: `https://example.fr/${"x".repeat(500)}` }],
		["substitute name", { substitute_name: "n".repeat(256) }],
		["substitute email", { substitute_email: `${"x".repeat(245)}@example.fr` }],
	])("rejects an oversized %s", (_label, overrides) => {
		expect(() => mapReferentFromV1(v1Referent(overrides))).toThrow("too_big");
	});
});

describe("mapReferentSnapshotFromV1", () => {
	it("maps a complete snapshot", () => {
		const snapshot = mapReferentSnapshotFromV1([
			v1Referent(),
			v1Referent({ id: SECOND_REFERENT_ID, county: "92" }),
		]);

		expect(snapshot).toHaveLength(2);
		expect(snapshot.map(({ id }) => id)).toEqual([
			REFERENT_ID,
			SECOND_REFERENT_ID,
		]);
	});

	it("rejects an empty snapshot", () => {
		expect(() => mapReferentSnapshotFromV1([])).toThrow(
			"Legacy referent snapshot is empty",
		);
	});

	it("rejects duplicate IDs with row positions only", () => {
		const sensitiveName = "Nom à ne jamais journaliser";
		const run = () =>
			mapReferentSnapshotFromV1([
				v1Referent(),
				v1Referent({ name: sensitiveName }),
			]);

		expect(run).toThrow("row 2:duplicate_id:first_seen_row_1");
		expect(run).not.toThrow(REFERENT_ID);
		expect(run).not.toThrow(sensitiveName);
	});

	it("aggregates invalid rows without exposing their values", () => {
		const sensitiveEmail = "private-contact@example.fr";
		const sensitiveName = "Nom privé";
		const run = () =>
			mapReferentSnapshotFromV1([
				v1Referent({ id: "invalid", value: sensitiveEmail }),
				v1Referent({
					id: SECOND_REFERENT_ID,
					name: sensitiveName,
					region: "999",
				}),
			]);

		expect(run).toThrow("row 1");
		expect(run).toThrow("row 2");
		expect(run).not.toThrow(sensitiveEmail);
		expect(run).not.toThrow(sensitiveName);
	});
});

describe("formatReport", () => {
	it("reports operational counts", () => {
		expect(
			formatReport({ totalRead: 120, targetBefore: 118, imported: 120 }, false),
		).toBe(
			[
				"import-v1-referents report",
				"  total read:    120",
				"  target before: 118",
				"  imported:      120",
			].join("\n"),
		);
	});

	it("identifies a dry run", () => {
		expect(
			formatReport({ totalRead: 1, targetBefore: 2, imported: 1 }, true),
		).toMatch(/^\[dry-run\] import-v1-referents report/);
	});
});
