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

vi.mock("~/modules/export", async () => ({
	toCsvField: (
		await vi.importActual<typeof import("~/modules/export/shared/csv")>(
			"~/modules/export/shared/csv",
		)
	).toCsvField,
}));

vi.mock("~/modules/public-api", async () => ({
	PUBLIC_API_EXPORT_HEADERS: (
		await vi.importActual<typeof import("~/modules/public-api/httpHeaders")>(
			"~/modules/public-api/httpHeaders",
		)
	).PUBLIC_API_EXPORT_HEADERS,
}));

const ROUTE_URL =
	"http://localhost/api/public/referents-egalite-professionnelle";

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

	it("neutralises a value that a spreadsheet would evaluate as a formula", async () => {
		setRows([
			{
				region: "11",
				county: "75",
				name: "=1+1",
				type: "url",
				value: '=HYPERLINK("http://example.fr")',
				principal: true,
				substituteName: "@SUM(A1:A2)",
				substituteEmail: "-2+3",
			},
		]);

		const { GET } = await import("../route");
		const response = await GET(new Request(`${ROUTE_URL}?format=csv`));

		const dataLine = (await response.text()).split("\n")[1];
		expect(dataLine).toContain(`"'=1+1"`);
		expect(dataLine).toContain(`"'=HYPERLINK(""http://example.fr"")"`);
		expect(dataLine).toContain(`"'@SUM(A1:A2)"`);
		expect(dataLine).toContain(`"'-2+3"`);
		expect(dataLine).not.toMatch(/(^|;)"[=+\-@|]/);
	});

	it.each([
		["json", ""],
		["csv", "?format=csv"],
	])("sends the public export CORS and cache headers (%s)", async (_format, query) => {
		setRows([]);

		const { GET } = await import("../route");
		const response = await GET(new Request(`${ROUTE_URL}${query}`));

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
			"GET, OPTIONS",
		);
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=3600, s-maxage=3600",
		);
	});

	it("answers the CORS preflight with the public export headers", async () => {
		const { OPTIONS } = await import("../route");
		const response = OPTIONS();

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
			"Content-Type, Authorization",
		);
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=3600, s-maxage=3600",
		);
	});

	it("returns 429 without querying the database once the anonymous quota is spent", async () => {
		setRows([]);
		const { GET } = await import("../route");
		const throttledRequest = () =>
			new Request(`${ROUTE_URL}?format=csv`, {
				headers: { "x-real-ip": "203.0.113.120" },
			});

		for (let index = 0; index < 120; index += 1) {
			expect((await GET(throttledRequest())).status).toBe(200);
		}
		const response = await GET(throttledRequest());

		expect(response.status).toBe(429);
		expect(response.headers.get("Retry-After")).toBe("60");
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(mocks.dbSelect).toHaveBeenCalledTimes(120);
		expect(mocks.logAction.mock.calls.at(-1)?.[0]).toMatchObject({
			action: "public_referents.search",
			status: "failure",
			errorMessage: "HTTP 429",
		});
	});

	it("rejects an unknown bearer token before querying the database", async () => {
		setRows([]);

		const { GET } = await import("../route");
		const response = await GET(
			new Request(ROUTE_URL, {
				headers: { Authorization: "Bearer unknown-token" },
			}),
		);

		expect(response.status).toBe(401);
		expect(mocks.dbSelect).not.toHaveBeenCalled();
	});
});
