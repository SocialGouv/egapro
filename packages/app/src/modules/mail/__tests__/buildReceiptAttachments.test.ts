import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	renderTaggedPdf: vi.fn(),
	buildPdfData: vi.fn(),
	DeclarationPdfDocument: vi.fn(),
	buildCseOpinionRecapData: vi.fn(),
	CseOpinionPdfDocument: vi.fn(),
	buildJointEvaluationRecapData: vi.fn(),
	JointEvaluationPdfDocument: vi.fn(),
	buildRepresentationPdfData: vi.fn(),
	RepresentationPdfDocument: vi.fn(),
}));

vi.mock("~/modules/declarationPdf/tagging/renderTaggedPdf", () => ({
	renderTaggedPdf: mocks.renderTaggedPdf,
}));

vi.mock("~/modules/declarationPdf/buildPdfData", () => ({
	buildPdfData: mocks.buildPdfData,
}));

vi.mock(
	"~/modules/declarationPdf/buildCseOpinionRecapData",
	async (importOriginal) => ({
		...(await importOriginal<
			typeof import("~/modules/declarationPdf/buildCseOpinionRecapData")
		>()),
		buildCseOpinionRecapData: mocks.buildCseOpinionRecapData,
	}),
);

vi.mock("~/modules/declarationPdf/buildJointEvaluationRecapData", () => ({
	buildJointEvaluationRecapData: mocks.buildJointEvaluationRecapData,
}));

vi.mock("~/modules/declarationPdf/JointEvaluationPdfDocument", () => ({
	JointEvaluationPdfDocument: mocks.JointEvaluationPdfDocument,
}));

vi.mock("~/modules/declarationPdf/DeclarationPdfDocument", () => ({
	DeclarationPdfDocument: mocks.DeclarationPdfDocument,
}));

vi.mock("~/modules/declarationPdf/CseOpinionPdfDocument", () => ({
	CseOpinionPdfDocument: mocks.CseOpinionPdfDocument,
}));

vi.mock("~/modules/declarationPdf/buildRepresentationPdfData", () => ({
	buildRepresentationPdfData: mocks.buildRepresentationPdfData,
}));

vi.mock("~/modules/declarationPdf/RepresentationPdfDocument", () => ({
	RepresentationPdfDocument: mocks.RepresentationPdfDocument,
}));

import {
	buildCseOpinionAttachments,
	buildDeclarationAttachments,
	buildJointEvaluationAttachments,
	buildRepresentationAttachments,
	buildSecondDeclarationAttachments,
} from "../buildReceiptAttachments";

const SIREN = "552100554";
const YEAR = 2025;

describe("buildReceiptAttachments", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.buildPdfData.mockResolvedValue({ year: YEAR });
		mocks.DeclarationPdfDocument.mockReturnValue("declaration-doc");
		mocks.buildCseOpinionRecapData.mockResolvedValue({ year: YEAR });
		mocks.CseOpinionPdfDocument.mockReturnValue("cse-opinion-doc");
		mocks.buildJointEvaluationRecapData.mockResolvedValue({ year: YEAR });
		mocks.JointEvaluationPdfDocument.mockReturnValue("joint-evaluation-doc");
		mocks.buildRepresentationPdfData.mockResolvedValue({
			campaignYear: YEAR + 1,
		});
		mocks.RepresentationPdfDocument.mockReturnValue("representation-doc");
		mocks.renderTaggedPdf.mockImplementation((doc: unknown) =>
			Promise.resolve(Buffer.from(String(doc))),
		);
	});

	describe("buildDeclarationAttachments", () => {
		it("attaches only the declaration recap and never renders the CSE opinion recap", async () => {
			const attachments = await buildDeclarationAttachments(SIREN, YEAR);

			expect(attachments).toHaveLength(1);
			expect(attachments[0]).toMatchObject({
				filename: `declaration-remuneration-${SIREN}-${YEAR}.pdf`,
				contentType: "application/pdf",
			});
			expect(mocks.buildCseOpinionRecapData).not.toHaveBeenCalled();
			expect(mocks.CseOpinionPdfDocument).not.toHaveBeenCalled();
		});

		it("renders the declaration recap as an initial declaration", async () => {
			await buildDeclarationAttachments(SIREN, YEAR);

			expect(mocks.buildPdfData).toHaveBeenCalledWith(
				SIREN,
				YEAR,
				expect.any(Date),
				"initial",
			);
		});
	});

	describe("buildSecondDeclarationAttachments", () => {
		it("attaches only the second declaration recap and never renders the CSE opinion recap", async () => {
			const attachments = await buildSecondDeclarationAttachments(SIREN, YEAR);

			expect(attachments).toHaveLength(1);
			expect(attachments[0]).toMatchObject({
				filename: `seconde-declaration-${SIREN}-${YEAR}.pdf`,
				contentType: "application/pdf",
			});
			expect(mocks.buildCseOpinionRecapData).not.toHaveBeenCalled();
			expect(mocks.CseOpinionPdfDocument).not.toHaveBeenCalled();
		});

		it("renders the declaration recap as a correction", async () => {
			await buildSecondDeclarationAttachments(SIREN, YEAR);

			expect(mocks.buildPdfData).toHaveBeenCalledWith(
				SIREN,
				YEAR,
				expect.any(Date),
				"correction",
			);
		});
	});

	describe("buildJointEvaluationAttachments", () => {
		it("attaches the joint evaluation recap under the route's file name", async () => {
			const attachments = await buildJointEvaluationAttachments(SIREN, YEAR);

			expect(attachments).toEqual([
				{
					filename: `evaluation-conjointe-${SIREN}-${YEAR}.pdf`,
					content: Buffer.from("joint-evaluation-doc"),
					contentType: "application/pdf",
				},
			]);
		});

		it("renders the recap from the shared builder", async () => {
			await buildJointEvaluationAttachments(SIREN, YEAR);

			expect(mocks.buildJointEvaluationRecapData).toHaveBeenCalledWith(
				SIREN,
				YEAR,
			);
			expect(mocks.JointEvaluationPdfDocument).toHaveBeenCalledWith({
				data: { year: YEAR },
			});
			expect(mocks.buildPdfData).not.toHaveBeenCalled();
		});

		it("lets a rendering failure reach the caller", async () => {
			mocks.renderTaggedPdf.mockRejectedValue(new Error("pdf worker died"));

			await expect(
				buildJointEvaluationAttachments(SIREN, YEAR),
			).rejects.toThrow("pdf worker died");
		});
	});

	describe("buildCseOpinionAttachments", () => {
		it("attaches the CSE opinion recap under the download's file name", async () => {
			const attachments = await buildCseOpinionAttachments(SIREN, YEAR);

			expect(attachments).toEqual([
				{
					filename: `avis-cse-${SIREN}-${YEAR}.pdf`,
					content: Buffer.from("cse-opinion-doc"),
					contentType: "application/pdf",
				},
			]);
		});

		it("renders the recap from the shared builder", async () => {
			await buildCseOpinionAttachments(SIREN, YEAR);

			expect(mocks.buildCseOpinionRecapData).toHaveBeenCalledWith(SIREN, YEAR);
			expect(mocks.CseOpinionPdfDocument).toHaveBeenCalledWith({
				data: { year: YEAR },
			});
			expect(mocks.renderTaggedPdf).toHaveBeenCalledWith("cse-opinion-doc");
			expect(mocks.buildPdfData).not.toHaveBeenCalled();
		});

		it("lets a missing transmission reach the caller", async () => {
			mocks.buildCseOpinionRecapData.mockRejectedValue(
				new Error("Avis du CSE non transmis"),
			);

			await expect(buildCseOpinionAttachments(SIREN, YEAR)).rejects.toThrow(
				"Avis du CSE non transmis",
			);
			expect(mocks.renderTaggedPdf).not.toHaveBeenCalled();
		});

		it("lets a rendering failure reach the caller", async () => {
			mocks.renderTaggedPdf.mockRejectedValue(new Error("pdf worker died"));

			await expect(buildCseOpinionAttachments(SIREN, YEAR)).rejects.toThrow(
				"pdf worker died",
			);
		});
	});

	describe("buildRepresentationAttachments", () => {
		it("attaches the representation recap under the download's file name", async () => {
			const attachments = await buildRepresentationAttachments(SIREN, YEAR);

			expect(attachments).toEqual([
				{
					filename: `representation-equilibree-${SIREN}-${YEAR + 1}.pdf`,
					content: Buffer.from("representation-doc"),
					contentType: "application/pdf",
				},
			]);
		});

		it("renders the recap from the shared builder", async () => {
			await buildRepresentationAttachments(SIREN, YEAR);

			expect(mocks.buildRepresentationPdfData).toHaveBeenCalledWith(
				SIREN,
				YEAR,
				expect.any(Date),
			);
			expect(mocks.RepresentationPdfDocument).toHaveBeenCalledWith({
				data: { campaignYear: YEAR + 1 },
			});
			expect(mocks.renderTaggedPdf).toHaveBeenCalledWith("representation-doc");
			expect(mocks.buildPdfData).not.toHaveBeenCalled();
			expect(mocks.buildJointEvaluationRecapData).not.toHaveBeenCalled();
		});

		it("lets a rendering failure reach the caller", async () => {
			mocks.renderTaggedPdf.mockRejectedValue(new Error("pdf worker died"));

			await expect(buildRepresentationAttachments(SIREN, YEAR)).rejects.toThrow(
				"pdf worker died",
			);
		});
	});
});
