import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	logAction: vi.fn().mockResolvedValue(undefined),
	buildTransmittedPdfData: vi.fn(),
	renderToBuffer: vi.fn(),
	TransmittedPdfDocument: vi.fn(),
}));

vi.mock("~/server/auth", () => ({ auth: mocks.auth }));

vi.mock("~/server/audit/log", () => ({ logAction: mocks.logAction }));

vi.mock("~/server/db", () => ({ db: {} }));

vi.mock("@react-pdf/renderer", () => ({
	renderToBuffer: mocks.renderToBuffer,
}));

vi.mock("~/modules/declarationPdf/TransmittedPdfDocument", () => ({
	TransmittedPdfDocument: mocks.TransmittedPdfDocument,
}));

vi.mock("~/modules/declarationPdf/buildTransmittedPdfData", () => ({
	buildTransmittedPdfData: mocks.buildTransmittedPdfData,
}));

import { AUDIT_ACTIONS } from "~/modules/audit";
import { getCurrentYear } from "~/modules/domain";
import { GET } from "../route";

const SIREN = "123456789";
const SIRET = `${SIREN}00015`;
const IMPERSONATED_SIREN = "987654321";
const YEAR = 2025;
const PDF_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]);
const DOCUMENT = { marker: "transmitted-pdf" };

function request(query = `?year=${YEAR}`) {
	return new Request(`https://egapro.test/api/transmitted-pdf${query}`);
}

function signedIn(user: Record<string, unknown>) {
	mocks.auth.mockResolvedValue({ user });
}

function auditRow(): Record<string, unknown> {
	return (mocks.logAction.mock.calls[0]?.[0] ?? {}) as Record<string, unknown>;
}

describe("GET /api/transmitted-pdf", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.renderToBuffer.mockResolvedValue(PDF_BYTES);
		mocks.TransmittedPdfDocument.mockReturnValue(DOCUMENT);
		mocks.buildTransmittedPdfData.mockResolvedValue({ year: YEAR });
		signedIn({ id: "user-1", email: "declarant@exemple.fr", siret: SIRET });
	});

	it("streams the transmitted recap of the requested year as a PDF attachment", async () => {
		const response = await GET(request());

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			`attachment; filename="recapitulatif-elements-transmis-${SIREN}-${YEAR + 1}.pdf"`,
		);
		expect(Buffer.from(await response.arrayBuffer())).toEqual(PDF_BYTES);
	});

	it("builds the document from the session siren and the requested year", async () => {
		await GET(request());

		expect(mocks.buildTransmittedPdfData).toHaveBeenCalledWith(
			SIREN,
			YEAR,
			expect.any(Date),
		);
		expect(mocks.renderToBuffer).toHaveBeenCalledWith(DOCUMENT);
	});

	it("falls back on the current year when none is requested", async () => {
		await GET(request(""));

		expect(mocks.buildTransmittedPdfData).toHaveBeenCalledWith(
			SIREN,
			getCurrentYear(),
			expect.any(Date),
		);
	});

	it("ignores a siren passed in the query string", async () => {
		await GET(request(`?year=${YEAR}&siren=999999999`));

		expect(mocks.buildTransmittedPdfData).toHaveBeenCalledWith(
			SIREN,
			YEAR,
			expect.any(Date),
		);
	});

	it("serves the impersonated company when an admin is in mimoquage", async () => {
		signedIn({
			id: "admin-1",
			email: "admin@exemple.fr",
			siret: "99999999900011",
			isAdmin: true,
			impersonation: { siren: IMPERSONATED_SIREN },
		});

		const response = await GET(request());

		expect(response.status).toBe(200);
		expect(mocks.buildTransmittedPdfData).toHaveBeenCalledWith(
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
		expect(mocks.buildTransmittedPdfData).not.toHaveBeenCalled();
		expect(auditRow()).toMatchObject({ siren: null });
	});

	it("answers 500 when the recap cannot be rendered", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		mocks.renderToBuffer.mockRejectedValue(new Error("pdf worker died"));

		const response = await GET(request());

		expect(response.status).toBe(500);
	});

	it("audits the download as a sensitive read", async () => {
		await GET(request());

		expect(auditRow()).toMatchObject({
			action: AUDIT_ACTIONS.PDF_TRANSMITTED_DOWNLOAD,
			status: "success",
			userId: "user-1",
			userEmail: "declarant@exemple.fr",
			siren: SIREN,
			metadata: { year: String(YEAR) },
		});
	});
});
