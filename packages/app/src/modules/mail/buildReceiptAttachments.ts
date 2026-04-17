import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildPdfData } from "~/modules/declarationPdf/buildPdfData";
import { buildTransmittedPdfData } from "~/modules/declarationPdf/buildTransmittedPdfData";
import { DeclarationPdfDocument } from "~/modules/declarationPdf/DeclarationPdfDocument";
import { TransmittedPdfDocument } from "~/modules/declarationPdf/TransmittedPdfDocument";
import type { MailAttachment } from "./types";

async function renderDeclarationPdf(
	siren: string,
	year: number,
	declarationType: "initial" | "correction",
): Promise<MailAttachment> {
	const data = await buildPdfData(siren, year, new Date(), declarationType);
	const buffer = await renderToBuffer(DeclarationPdfDocument({ data }));
	const prefix =
		declarationType === "correction"
			? "seconde-declaration"
			: "declaration-remuneration";
	return {
		filename: `${prefix}-${siren}-${year}.pdf`,
		content: Buffer.from(buffer),
		contentType: "application/pdf",
	};
}

async function renderTransmittedPdf(
	siren: string,
	year: number,
): Promise<MailAttachment> {
	const data = await buildTransmittedPdfData(siren, year, new Date());
	const buffer = await renderToBuffer(TransmittedPdfDocument({ data }));
	return {
		filename: `recapitulatif-elements-transmis-${siren}-${data.year + 1}.pdf`,
		content: Buffer.from(buffer),
		contentType: "application/pdf",
	};
}

export async function buildDeclarationAttachments(
	siren: string,
	year: number,
): Promise<MailAttachment[]> {
	return Promise.all([
		renderDeclarationPdf(siren, year, "initial"),
		renderTransmittedPdf(siren, year),
	]);
}

export async function buildSecondDeclarationAttachments(
	siren: string,
	year: number,
): Promise<MailAttachment[]> {
	return Promise.all([
		renderDeclarationPdf(siren, year, "correction"),
		renderTransmittedPdf(siren, year),
	]);
}
