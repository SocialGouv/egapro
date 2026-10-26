import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildJointEvaluationRecapData } from "~/modules/declarationPdf/buildJointEvaluationRecapData";
import { buildPdfData } from "~/modules/declarationPdf/buildPdfData";
import { DeclarationPdfDocument } from "~/modules/declarationPdf/DeclarationPdfDocument";
import { JointEvaluationPdfDocument } from "~/modules/declarationPdf/JointEvaluationPdfDocument";
import { jointEvaluationPdfFilename } from "~/modules/declarationPdf/jointEvaluationPdfFilename";
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

export async function buildDeclarationAttachments(
	siren: string,
	year: number,
): Promise<MailAttachment[]> {
	// The transmitted recap is structurally empty at first declaration.
	return [await renderDeclarationPdf(siren, year, "initial")];
}

export async function buildSecondDeclarationAttachments(
	siren: string,
	year: number,
): Promise<MailAttachment[]> {
	return [await renderDeclarationPdf(siren, year, "correction")];
}

export async function buildJointEvaluationAttachments(
	siren: string,
	year: number,
): Promise<MailAttachment[]> {
	const data = await buildJointEvaluationRecapData(siren, year);
	const buffer = await renderToBuffer(JointEvaluationPdfDocument({ data }));
	return [
		{
			filename: jointEvaluationPdfFilename(siren, year),
			content: Buffer.from(buffer),
			contentType: "application/pdf",
		},
	];
}
