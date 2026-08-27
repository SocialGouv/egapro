import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	renderToBuffer: vi.fn(),
	buildPdfData: vi.fn(),
	buildTransmittedPdfData: vi.fn(),
	DeclarationPdfDocument: vi.fn(),
	TransmittedPdfDocument: vi.fn(),
}));

vi.mock("@react-pdf/renderer", () => ({
	renderToBuffer: mocks.renderToBuffer,
}));

vi.mock("~/modules/declarationPdf/buildPdfData", () => ({
	buildPdfData: mocks.buildPdfData,
}));

vi.mock("~/modules/declarationPdf/buildTransmittedPdfData", () => ({
	buildTransmittedPdfData: mocks.buildTransmittedPdfData,
}));

vi.mock("~/modules/declarationPdf/DeclarationPdfDocument", () => ({
	DeclarationPdfDocument: mocks.DeclarationPdfDocument,
}));

vi.mock("~/modules/declarationPdf/TransmittedPdfDocument", () => ({
	TransmittedPdfDocument: mocks.TransmittedPdfDocument,
}));

import {
	buildDeclarationAttachments,
	buildSecondDeclarationAttachments,
} from "../buildReceiptAttachments";

const SIREN = "552100554";
const YEAR = 2025;

describe("buildReceiptAttachments", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.buildPdfData.mockResolvedValue({ year: YEAR });
		mocks.buildTransmittedPdfData.mockResolvedValue({ year: YEAR });
		mocks.DeclarationPdfDocument.mockReturnValue("declaration-doc");
		mocks.TransmittedPdfDocument.mockReturnValue("transmitted-doc");
		mocks.renderToBuffer.mockImplementation((doc: unknown) =>
			Promise.resolve(Buffer.from(String(doc))),
		);
	});

	describe("buildDeclarationAttachments", () => {
		it("attaches only the declaration recap and never renders the transmitted recap", async () => {
			const attachments = await buildDeclarationAttachments(SIREN, YEAR);

			expect(attachments).toHaveLength(1);
			expect(attachments[0]).toMatchObject({
				filename: `declaration-remuneration-${SIREN}-${YEAR}.pdf`,
				contentType: "application/pdf",
			});
			expect(mocks.buildTransmittedPdfData).not.toHaveBeenCalled();
			expect(mocks.TransmittedPdfDocument).not.toHaveBeenCalled();
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
		it("attaches only the second declaration recap and never renders the transmitted recap", async () => {
			const attachments = await buildSecondDeclarationAttachments(SIREN, YEAR);

			expect(attachments).toHaveLength(1);
			expect(attachments[0]).toMatchObject({
				filename: `seconde-declaration-${SIREN}-${YEAR}.pdf`,
				contentType: "application/pdf",
			});
			expect(mocks.buildTransmittedPdfData).not.toHaveBeenCalled();
			expect(mocks.TransmittedPdfDocument).not.toHaveBeenCalled();
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
});
