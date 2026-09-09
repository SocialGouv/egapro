import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	logAction: vi.fn().mockResolvedValue(undefined),
	limit: vi.fn(),
	renderToBuffer: vi.fn(),
	PrefillPdfDocument: vi.fn(),
}));

vi.mock("~/server/auth", () => ({ auth: mocks.auth }));

vi.mock("~/server/audit/log", () => ({ logAction: mocks.logAction }));

vi.mock("@react-pdf/renderer", () => ({
	renderToBuffer: mocks.renderToBuffer,
}));

vi.mock("~/modules/declarationPdf/PrefillPdfDocument", () => ({
	PrefillPdfDocument: mocks.PrefillPdfDocument,
}));

vi.mock("~/server/db", () => ({
	db: {
		select: () => ({
			from: () => ({ where: () => ({ limit: mocks.limit }) }),
		}),
	},
}));

vi.mock("~/server/db/schema", () => ({
	companies: { siren: "siren", name: "name" },
	gipMdsData: { siren: "siren", year: "year" },
}));

import { AUDIT_ACTIONS } from "~/modules/audit";
import { getCurrentYear } from "~/modules/domain";
import { GET } from "../route";

const SIREN = "123456789";
const SIRET = `${SIREN}00015`;
const IMPERSONATED_SIREN = "987654321";
const YEAR = 2025;
const PDF_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]);
const DOCUMENT = { marker: "prefill-pdf" };
const GIP_ROW = { periodStart: "2025-01-01", periodEnd: "2025-12-31" };

function request(query = `?year=${YEAR}`) {
	return new Request(`https://egapro.test/api/prefill-pdf${query}`);
}

function signedIn(user: Record<string, unknown>) {
	mocks.auth.mockResolvedValue({ user });
}

function auditRow(): Record<string, unknown> {
	return (mocks.logAction.mock.calls[0]?.[0] ?? {}) as Record<string, unknown>;
}

function prefilledCompany() {
	mocks.limit
		.mockResolvedValueOnce([GIP_ROW])
		.mockResolvedValueOnce([{ name: "Société Démo" }]);
}

describe("GET /api/prefill-pdf", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.renderToBuffer.mockResolvedValue(PDF_BYTES);
		mocks.PrefillPdfDocument.mockReturnValue(DOCUMENT);
		signedIn({ id: "user-1", email: "declarant@exemple.fr", siret: SIRET });
	});

	it("streams the prefilled data of the requested year as a PDF attachment", async () => {
		prefilledCompany();

		const response = await GET(request());

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			`attachment; filename="donnees-preremplies-${SIREN}-${YEAR}.pdf"`,
		);
		expect(Buffer.from(await response.arrayBuffer())).toEqual(PDF_BYTES);
	});

	it("builds the document for the session siren and the requested year", async () => {
		prefilledCompany();

		await GET(request());

		expect(mocks.PrefillPdfDocument).toHaveBeenCalledWith({
			data: expect.objectContaining({
				siren: SIREN,
				year: YEAR,
				companyName: "Société Démo",
			}),
		});
	});

	it("falls back on the company placeholder name when none is stored", async () => {
		mocks.limit.mockResolvedValueOnce([GIP_ROW]).mockResolvedValueOnce([]);

		await GET(request());

		expect(mocks.PrefillPdfDocument).toHaveBeenCalledWith({
			data: expect.objectContaining({ companyName: `Entreprise ${SIREN}` }),
		});
	});

	it("falls back on the current year when none is requested", async () => {
		prefilledCompany();

		await GET(request(""));

		expect(mocks.PrefillPdfDocument).toHaveBeenCalledWith({
			data: expect.objectContaining({ year: getCurrentYear() }),
		});
	});

	it("serves the impersonated company when an admin is in mimoquage", async () => {
		prefilledCompany();
		signedIn({
			id: "admin-1",
			email: "admin@exemple.fr",
			siret: "99999999900011",
			isAdmin: true,
			impersonation: { siren: IMPERSONATED_SIREN },
		});

		const response = await GET(request());

		expect(response.status).toBe(200);
		expect(mocks.PrefillPdfDocument).toHaveBeenCalledWith({
			data: expect.objectContaining({ siren: IMPERSONATED_SIREN }),
		});
		expect(auditRow()).toMatchObject({ siren: IMPERSONATED_SIREN });
	});

	it.each([
		["no session at all", null],
		["a session without a siret", { user: { id: "user-1" } }],
		[
			"a session whose siret is malformed",
			{ user: { id: "user-1", siret: "1234A678900015" } },
		],
		[
			"a session whose siret is too short",
			{ user: { id: "user-1", siret: "1234" } },
		],
	])("refuses the download with %s", async (_label, session) => {
		mocks.auth.mockResolvedValue(session);

		const response = await GET(request());

		expect(response.status).toBe(401);
		expect(mocks.limit).not.toHaveBeenCalled();
		expect(auditRow()).toMatchObject({
			action: AUDIT_ACTIONS.PDF_PREFILL_DOWNLOAD,
			status: "failure",
			siren: null,
			errorMessage: "HTTP 401",
		});
	});

	it("audits the download as a sensitive read", async () => {
		prefilledCompany();

		await GET(request());

		expect(auditRow()).toMatchObject({
			action: AUDIT_ACTIONS.PDF_PREFILL_DOWNLOAD,
			status: "success",
			userId: "user-1",
			userEmail: "declarant@exemple.fr",
			siren: SIREN,
			metadata: { year: YEAR, invalidYear: false },
		});
	});

	it("audits no year at all when none is requested", async () => {
		prefilledCompany();

		await GET(request(""));

		expect(auditRow()).toMatchObject({
			metadata: { year: null, invalidYear: false },
		});
	});

	it.each([
		["out of range", "1900"],
		["not a number", "abc"],
		["a number with a trailing suffix", "2025abc"],
	])("answers 400 when the requested year is %s", async (_label, year) => {
		const response = await GET(request(`?year=${year}`));

		expect(response.status).toBe(400);
		expect(mocks.limit).not.toHaveBeenCalled();
	});

	it.each([
		["without a session", null, 401],
		["with a session", { user: { id: "user-1", siret: SIRET } }, 400],
	])("audits an oversized year as null %s", async (_label, session, status) => {
		mocks.auth.mockResolvedValue(session);

		const response = await GET(request(`?year=${"x".repeat(5_000)}`));

		expect(response.status).toBe(status);
		expect(auditRow()).toMatchObject({
			status: "failure",
			metadata: { year: null, invalidYear: true },
		});
	});

	it("answers 404 when no prefilled data exists for the year", async () => {
		mocks.limit.mockResolvedValueOnce([]);

		const response = await GET(request());

		expect(response.status).toBe(404);
		expect(mocks.renderToBuffer).not.toHaveBeenCalled();
	});

	it("answers 500 when the document cannot be rendered", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		prefilledCompany();
		mocks.renderToBuffer.mockRejectedValue(new Error("pdf worker died"));

		const response = await GET(request());

		expect(response.status).toBe(500);
	});
});
