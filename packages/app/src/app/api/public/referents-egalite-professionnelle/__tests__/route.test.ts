import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	dbSelect: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: { select: mocks.dbSelect },
}));

vi.mock("~/server/db/schema", () => ({
	referents: {
		region: "region",
		county: "county",
		name: "name",
		type: "type",
		value: "value",
		principal: "principal",
		substituteName: "substituteName",
		substituteEmail: "substituteEmail",
	},
}));

vi.mock("drizzle-orm", () => ({
	asc: (col: unknown) => ({ asc: col }),
}));

function setRows(rows: unknown[]) {
	mocks.dbSelect.mockReturnValue({
		from: () => ({
			orderBy: () => Promise.resolve(rows),
		}),
	});
}

describe("/api/public/referents-egalite-professionnelle", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("returns JSON by default", async () => {
		setRows([
			{
				region: "11",
				county: "75",
				name: "Jean",
				type: "email",
				value: "j@gouv.fr",
				principal: true,
				substituteName: null,
				substituteEmail: null,
			},
		]);

		const { GET } = await import("../route");
		const response = await GET(
			new Request("http://localhost/api/public/referents-egalite-professionnelle"),
		);

		expect(response.headers.get("Content-Type")).toMatch(/application\/json/);
		const body = await response.json();
		expect(body).toHaveLength(1);
		expect(body[0]).toMatchObject({ name: "Jean", region: "11" });
	});

	it("returns CSV with headers and region/county labels when format=csv", async () => {
		setRows([
			{
				region: "11",
				county: "75",
				name: "Jean",
				type: "email",
				value: 'j"@gouv.fr',
				principal: true,
				substituteName: "Marie",
				substituteEmail: "m@gouv.fr",
			},
			{
				region: "11",
				county: null,
				name: "Sans département",
				type: "url",
				value: "https://gouv.fr",
				principal: false,
				substituteName: null,
				substituteEmail: null,
			},
		]);

		const { GET } = await import("../route");
		const response = await GET(
			new Request(
				"http://localhost/api/public/referents-egalite-professionnelle?format=csv",
			),
		);

		expect(response.headers.get("Content-Type")).toContain("text/csv");
		expect(response.headers.get("Content-Disposition")).toContain(
			"referents_egalite_professionnelle.csv",
		);

		const csv = await response.text();
		const lines = csv.split("\n");
		expect(lines[0]).toBe(
			"Région;Département;Nom;Type;Valeur;Principal;Nom suppléant;Email suppléant",
		);
		expect(lines[1]).toContain('"Jean"');
		expect(lines[1]).toContain('"j""@gouv.fr"');
		expect(lines[1]).toContain('"Oui"');
		expect(lines[2]).toContain('"Sans département"');
		expect(lines[2]).toContain('"Non"');
		expect(lines[2]).toContain('""');
	});
});
