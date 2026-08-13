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
import { GET } from "../route";

const SIREN = "123456789";
const SIRET = `${SIREN}00015`;
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

function auditRow(): Record<string, unknown> {
	return (mocks.logAction.mock.calls[0]?.[0] ?? {}) as Record<string, unknown>;
}

describe("GET /api/representation-pdf", () => {
	beforeEach(() => {
		vi.clearAllMocks();
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

	it.each([
		["no session at all", null],
		["a session without a siret", { user: { id: "user-1" } }],
	])("refuses the download with %s", async (_label, session) => {
		mocks.auth.mockResolvedValue(session);

		const response = await GET(request());

		expect(response.status).toBe(401);
		expect(mocks.buildRepresentationPdfData).not.toHaveBeenCalled();
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
