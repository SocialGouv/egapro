import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	logAction: vi.fn().mockResolvedValue(undefined),
	buildRepresentationPdfData: vi.fn(),
	renderToBuffer: vi.fn(),
	RepresentationPdfDocument: vi.fn(),
}));

vi.mock("~/server/auth", () => ({ auth: mocks.auth }));

vi.mock("~/server/audit/log", () => ({ logAction: mocks.logAction }));

vi.mock("~/server/db", () => ({ db: {} }));

vi.mock("@react-pdf/renderer", () => ({
	renderToBuffer: mocks.renderToBuffer,
}));

vi.mock("~/modules/declarationPdf/RepresentationPdfDocument", () => ({
	RepresentationPdfDocument: mocks.RepresentationPdfDocument,
}));

// Only the query is stubbed: the route branches on the real error class, so it
// has to be the very one the builder module exports.
vi.mock(
	"~/modules/declarationPdf/buildRepresentationPdfData",
	async (importOriginal) => ({
		...(await importOriginal<
			typeof import("~/modules/declarationPdf/buildRepresentationPdfData")
		>()),
		buildRepresentationPdfData: mocks.buildRepresentationPdfData,
	}),
);

import { AUDIT_ACTIONS } from "~/modules/audit";
import { RepresentationDeclarationNotFoundError } from "~/modules/declarationPdf/buildRepresentationPdfData";
import { getCurrentYear, getReferenceYearFor } from "~/modules/domain";
import { clearPdfSizeCache } from "~/server/pdf/pdfSizeCache";
import { GET, HEAD } from "../route";

const SIREN = "123456789";
const SIRET = `${SIREN}00015`;
const IMPERSONATED_SIREN = "987654321";
/** A second factor presented a minute ago — inside the admin MFA window. */
const FRESH_MFA = Math.floor(Date.now() / 1000) - 60;
const YEAR = 2025;
const PDF_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]);
const DOCUMENT = { marker: "representation-pdf" };

function request(query = `?year=${YEAR}`) {
	return new Request(`https://egapro.test/api/representation-pdf${query}`);
}

function signedIn() {
	mocks.auth.mockResolvedValue({
		user: { id: "user-1", email: "declarant@exemple.fr", siret: SIRET },
	});
}

let generationTick = 0;

function nextGeneratedAt(): Date {
	generationTick += 1;
	return new Date(Date.UTC(2026, 0, 1, 0, 0, 0, generationTick));
}

function auditRow(): Record<string, unknown> {
	return (mocks.logAction.mock.calls[0]?.[0] ?? {}) as Record<string, unknown>;
}

describe("GET /api/representation-pdf", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearPdfSizeCache();
		mocks.renderToBuffer.mockResolvedValue(PDF_BYTES);
		mocks.RepresentationPdfDocument.mockReturnValue(DOCUMENT);
		mocks.buildRepresentationPdfData.mockResolvedValue({
			campaignYear: YEAR + 1,
		});
		signedIn();
	});

	it("streams the recap of the requested year as a PDF attachment (S20)", async () => {
		const response = await GET(request());

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			`attachment; filename="representation-equilibree-${SIREN}-${YEAR + 1}.pdf"`,
		);
		expect(response.headers.get("Content-Length")).toBe(
			String(PDF_BYTES.byteLength),
		);
		expect(Buffer.from(await response.arrayBuffer())).toEqual(PDF_BYTES);
	});

	it("renders the document built from the session siren and the requested year", async () => {
		await GET(request());

		expect(mocks.buildRepresentationPdfData).toHaveBeenCalledWith(
			SIREN,
			YEAR,
			expect.any(Date),
		);
		expect(mocks.RepresentationPdfDocument).toHaveBeenCalledWith({
			data: { campaignYear: YEAR + 1 },
		});
		expect(mocks.renderToBuffer).toHaveBeenCalledWith(DOCUMENT);
	});

	it("falls back on the current reference year when none is requested", async () => {
		await GET(request(""));

		expect(mocks.buildRepresentationPdfData).toHaveBeenCalledWith(
			SIREN,
			getReferenceYearFor(getCurrentYear()),
			expect.any(Date),
		);
	});

	it("ignores a siren passed in the query string", async () => {
		await GET(request(`?year=${YEAR}&siren=999999999`));

		expect(mocks.buildRepresentationPdfData).toHaveBeenCalledWith(
			SIREN,
			YEAR,
			expect.any(Date),
		);
	});

	it("serves the impersonated company when an admin is in mimoquage", async () => {
		mocks.auth.mockResolvedValue({
			user: {
				id: "admin-1",
				email: "admin@exemple.fr",
				siret: "99999999900011",
				isAdmin: true,
				adminMfaAt: FRESH_MFA,
				impersonation: { siren: IMPERSONATED_SIREN },
			},
		});

		const response = await GET(request());

		expect(response.status).toBe(200);
		expect(mocks.buildRepresentationPdfData).toHaveBeenCalledWith(
			IMPERSONATED_SIREN,
			YEAR,
			expect.any(Date),
		);
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
		expect(mocks.buildRepresentationPdfData).not.toHaveBeenCalled();
		expect(auditRow()).toMatchObject({ siren: null });
	});

	it("answers 404 when no declaration was transmitted for the year", async () => {
		mocks.buildRepresentationPdfData.mockRejectedValue(
			new RepresentationDeclarationNotFoundError(),
		);

		const response = await GET(request());

		expect(response.status).toBe(404);
		expect(mocks.renderToBuffer).not.toHaveBeenCalled();
	});

	it("answers 400 when the recap cannot be rendered", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		mocks.renderToBuffer.mockRejectedValue(new Error("pdf worker died"));

		const response = await GET(request());

		expect(response.status).toBe(400);
	});

	it("audits the download as a sensitive read", async () => {
		await GET(request());

		expect(auditRow()).toMatchObject({
			action: AUDIT_ACTIONS.PDF_REPRESENTATION_DOWNLOAD,
			status: "success",
			userId: "user-1",
			userEmail: "declarant@exemple.fr",
			siren: SIREN,
			metadata: { year: String(YEAR) },
		});
	});

	it("audits a refused download as a failure without a siren", async () => {
		mocks.auth.mockResolvedValue(null);

		await GET(request());

		expect(auditRow()).toMatchObject({
			action: AUDIT_ACTIONS.PDF_REPRESENTATION_DOWNLOAD,
			status: "failure",
			siren: null,
			errorMessage: "HTTP 401",
		});
	});
});

describe("HEAD /api/representation-pdf", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearPdfSizeCache();
		mocks.renderToBuffer.mockResolvedValue(PDF_BYTES);
		mocks.RepresentationPdfDocument.mockReturnValue(DOCUMENT);
		generationTick = 0;
		// The real builder stamps a fresh Date on every call, and two calls in the
		// same millisecond would collide — so the fixture advances explicitly.
		// Without this the cache assertions hold whatever the key does.
		mocks.buildRepresentationPdfData.mockImplementation(() =>
			Promise.resolve({
				campaignYear: YEAR + 1,
				generatedAt: nextGeneratedAt(),
			}),
		);
		signedIn();
	});

	it("answers the size with an empty body", async () => {
		const response = await HEAD(request());

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Length")).toBe(
			String(PDF_BYTES.byteLength),
		);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(await response.text()).toBe("");
	});

	it("serves the size a preceding download already paid for", async () => {
		await GET(request());
		expect(mocks.renderToBuffer).toHaveBeenCalledTimes(1);

		const response = await HEAD(request());

		expect(response.headers.get("Content-Length")).toBe(
			String(PDF_BYTES.byteLength),
		);
		expect(mocks.renderToBuffer).toHaveBeenCalledTimes(1);
	});

	it("renders once for repeated probes on the same data", async () => {
		await HEAD(request());
		await HEAD(request());

		expect(mocks.renderToBuffer).toHaveBeenCalledTimes(1);
	});

	it("renders again once the underlying data changed", async () => {
		await HEAD(request());

		mocks.buildRepresentationPdfData.mockImplementation(() =>
			Promise.resolve({
				campaignYear: YEAR + 1,
				gaps: [{ category: "cadres", gap: 4 }],
				generatedAt: nextGeneratedAt(),
			}),
		);
		await HEAD(request());

		expect(mocks.renderToBuffer).toHaveBeenCalledTimes(2);
	});

	it.each([
		["no session at all", null],
		["a session without a siret", { user: { id: "user-1" } }],
	])("refuses the probe with %s", async (_label, session) => {
		mocks.auth.mockResolvedValue(session);

		const response = await HEAD(request());

		expect(response.status).toBe(401);
		expect(mocks.buildRepresentationPdfData).not.toHaveBeenCalled();
	});

	it("answers 404 when no declaration was transmitted for the year", async () => {
		mocks.buildRepresentationPdfData.mockRejectedValue(
			new RepresentationDeclarationNotFoundError(),
		);

		const response = await HEAD(request());

		expect(response.status).toBe(404);
		expect(response.headers.get("Content-Length")).toBeNull();
	});

	it("audits the probe under its own action, never as a download", async () => {
		await HEAD(request());

		expect(auditRow()).toMatchObject({
			action: AUDIT_ACTIONS.PDF_SIZE_PROBE,
			status: "success",
			userId: "user-1",
			userEmail: "declarant@exemple.fr",
			siren: SIREN,
			metadata: { year: String(YEAR) },
		});
		expect(auditRow().action).not.toBe(
			AUDIT_ACTIONS.PDF_REPRESENTATION_DOWNLOAD,
		);
	});
});
