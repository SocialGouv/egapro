import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	dbSelect: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: { select: mocks.dbSelect },
}));

vi.mock("~/server/audit/log", () => ({
	logAction: (...args: unknown[]) => mocks.logAction(...args),
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
			new Request(
				"http://localhost/api/public/referents-egalite-professionnelle",
			),
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
	it("writes a public_referents.search audit entry on success", async () => {
		setRows([]);

		const { GET } = await import("../route");
		await GET(
			new Request(
				"http://localhost/api/public/referents-egalite-professionnelle",
				{
					headers: {
						"x-forwarded-for": "203.0.113.42",
						"user-agent": "ReferentsAgent",
					},
				},
			),
		);

		expect(mocks.logAction).toHaveBeenCalledOnce();
		expect(mocks.logAction.mock.calls[0]?.[0]).toMatchObject({
			action: "public_referents.search",
			status: "success",
			metadata: { format: "json" },
			ipAddress: "203.0.113.42",
			userAgent: "ReferentsAgent",
		});
	});

	it("records the requested format in the audit metadata", async () => {
		setRows([]);

		const { GET } = await import("../route");
		await GET(
			new Request(
				"http://localhost/api/public/referents-egalite-professionnelle?format=csv",
			),
		);

		expect(mocks.logAction.mock.calls[0]?.[0]).toMatchObject({
			action: "public_referents.search",
			status: "success",
			metadata: { format: "csv" },
		});
	});

	it("normalises an arbitrary format so it never reaches the audit metadata", async () => {
		setRows([]);

		const { GET } = await import("../route");
		const response = await GET(
			new Request(
				`http://localhost/api/public/referents-egalite-professionnelle?format=${"x".repeat(5000)}`,
			),
		);

		expect(response.headers.get("Content-Type")).toMatch(/application\/json/);
		expect(mocks.logAction.mock.calls[0]?.[0]).toMatchObject({
			metadata: { format: "json" },
		});
	});

	it("logs a failure entry when the query throws", async () => {
		mocks.dbSelect.mockReturnValue({
			from: () => ({
				orderBy: () => Promise.reject(new Error("db down")),
			}),
		});

		const { GET } = await import("../route");
		await expect(
			GET(
				new Request(
					"http://localhost/api/public/referents-egalite-professionnelle",
				),
			),
		).rejects.toThrow("db down");

		expect(mocks.logAction.mock.calls[0]?.[0]).toMatchObject({
			action: "public_referents.search",
			status: "failure",
			errorMessage: "db down",
		});
	});
});
