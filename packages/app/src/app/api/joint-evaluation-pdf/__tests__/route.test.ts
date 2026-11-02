import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	logAction: vi.fn().mockResolvedValue(undefined),
	buildJointEvaluationRecapData: vi.fn(),
	renderToBuffer: vi.fn(),
	JointEvaluationPdfDocument: vi.fn(),
}));

vi.mock("~/server/auth", () => ({ auth: mocks.auth }));

vi.mock("~/server/audit/log", () => ({ logAction: mocks.logAction }));

vi.mock("~/server/db", () => ({ db: {} }));

vi.mock("@react-pdf/renderer", () => ({
	renderToBuffer: mocks.renderToBuffer,
}));

vi.mock("~/modules/declarationPdf/JointEvaluationPdfDocument", () => ({
	JointEvaluationPdfDocument: mocks.JointEvaluationPdfDocument,
}));

vi.mock("~/modules/declarationPdf/buildJointEvaluationRecapData", async () => {
	class JointEvaluationNotTransmittedError extends Error {}
	return {
		buildJointEvaluationRecapData: mocks.buildJointEvaluationRecapData,
		JointEvaluationNotTransmittedError,
	};
});

import { AUDIT_ACTIONS } from "~/modules/audit";
import { JointEvaluationNotTransmittedError } from "~/modules/declarationPdf/buildJointEvaluationRecapData";
import { getCurrentYear } from "~/modules/domain";
import { GET, HEAD } from "../route";

const SIREN = "123456789";
const SIRET = `${SIREN}00015`;
const YEAR = 2027;
const PDF_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
const DOCUMENT = { marker: "joint-evaluation-pdf" };

function request(query = `?year=${YEAR}`, method = "GET") {
	return new Request(`https://egapro.test/api/joint-evaluation-pdf${query}`, {
		method,
	});
}

function auditRow(): Record<string, unknown> {
	return (mocks.logAction.mock.calls[0]?.[0] ?? {}) as Record<string, unknown>;
}

describe("/api/joint-evaluation-pdf", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.renderToBuffer.mockResolvedValue(PDF_BYTES);
		mocks.JointEvaluationPdfDocument.mockReturnValue(DOCUMENT);
		mocks.buildJointEvaluationRecapData.mockImplementation(
			async (_siren: string, year: number) => ({ year, marker: "recap" }),
		);
		mocks.auth.mockResolvedValue({
			user: { id: "user-1", email: "email@example.fr", siret: SIRET },
		});
	});

	describe("GET", () => {
		it("streams the recap of the requested year as a PDF attachment", async () => {
			const response = await GET(request());

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe("application/pdf");
			expect(response.headers.get("Content-Disposition")).toBe(
				`attachment; filename="evaluation-conjointe-${SIREN}-${YEAR}.pdf"`,
			);
			expect(response.headers.get("Cache-Control")).toBe("private, no-store");
			expect(Buffer.from(await response.arrayBuffer())).toEqual(PDF_BYTES);
			expect(mocks.buildJointEvaluationRecapData).toHaveBeenCalledWith(
				SIREN,
				YEAR,
			);
			expect(mocks.renderToBuffer).toHaveBeenCalledWith(DOCUMENT);
		});

		it("falls back on the current year when none is requested", async () => {
			await GET(request(""));

			expect(mocks.buildJointEvaluationRecapData).toHaveBeenCalledWith(
				SIREN,
				getCurrentYear(),
			);
		});

		it("ignores a siren passed in the query string", async () => {
			await GET(request(`?year=${YEAR}&siren=999999999`));

			expect(mocks.buildJointEvaluationRecapData).toHaveBeenCalledWith(
				SIREN,
				YEAR,
			);
		});

		it("answers 404 when the joint evaluation is not transmitted", async () => {
			mocks.buildJointEvaluationRecapData.mockRejectedValue(
				new JointEvaluationNotTransmittedError(),
			);

			const response = await GET(request());

			expect(response.status).toBe(404);
			expect(mocks.renderToBuffer).not.toHaveBeenCalled();
		});

		it("answers 401 without a siren in session", async () => {
			mocks.auth.mockResolvedValue(null);

			const response = await GET(request());

			expect(response.status).toBe(401);
			expect(mocks.buildJointEvaluationRecapData).not.toHaveBeenCalled();
			expect(auditRow()).toMatchObject({ siren: null });
		});

		it("answers 400 when the requested year is invalid", async () => {
			const response = await GET(request("?year=abc"));

			expect(response.status).toBe(400);
			expect(mocks.buildJointEvaluationRecapData).not.toHaveBeenCalled();
			expect(auditRow().metadata).toEqual({ invalidParam: "year" });
		});

		it("answers 500 when the recap cannot be built", async () => {
			vi.spyOn(console, "error").mockImplementation(() => undefined);
			mocks.buildJointEvaluationRecapData.mockRejectedValue(
				new Error("database down"),
			);

			const response = await GET(request());

			expect(response.status).toBe(500);
		});

		it("audits every download as a sensitive read under its own key", async () => {
			await GET(request());

			expect(auditRow()).toMatchObject({
				action: AUDIT_ACTIONS.PDF_JOINT_EVALUATION_DOWNLOAD,
				status: "success",
				userId: "user-1",
				siren: SIREN,
				metadata: { year: YEAR },
			});
		});
	});

	describe("HEAD", () => {
		it("answers the PDF size without a body", async () => {
			const response = await HEAD(request(`?year=${YEAR + 1}`, "HEAD"));

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Length")).toBe(
				String(PDF_BYTES.byteLength),
			);
			expect(await response.text()).toBe("");
		});

		it("reuses the size cached by a previous download", async () => {
			await GET(request(`?year=${YEAR + 2}`));
			mocks.renderToBuffer.mockClear();

			const response = await HEAD(request(`?year=${YEAR + 2}`, "HEAD"));

			expect(response.headers.get("Content-Length")).toBe(
				String(PDF_BYTES.byteLength),
			);
			expect(mocks.renderToBuffer).not.toHaveBeenCalled();
		});

		it("mirrors the GET status without a body when the recap is unavailable", async () => {
			mocks.buildJointEvaluationRecapData.mockRejectedValue(
				new JointEvaluationNotTransmittedError(),
			);

			const response = await HEAD(request(`?year=${YEAR}`, "HEAD"));

			expect(response.status).toBe(404);
			expect(await response.text()).toBe("");
		});

		it("answers 500 without a body when the probe fails", async () => {
			vi.spyOn(console, "error").mockImplementation(() => undefined);
			mocks.renderToBuffer.mockRejectedValue(new Error("pdf worker died"));

			const response = await HEAD(request(`?year=${YEAR + 3}`, "HEAD"));

			expect(response.status).toBe(500);
		});

		it("audits the probe as a size probe", async () => {
			await HEAD(request(`?year=${YEAR}`, "HEAD"));

			expect(auditRow()).toMatchObject({
				action: AUDIT_ACTIONS.PDF_SIZE_PROBE,
				siren: SIREN,
			});
		});
	});
});
