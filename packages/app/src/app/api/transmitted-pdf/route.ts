import { renderToBuffer } from "@react-pdf/renderer";
import { buildTransmittedPdfData } from "~/modules/declarationPdf/buildTransmittedPdfData";
import { TransmittedPdfDocument } from "~/modules/declarationPdf/TransmittedPdfDocument";
import { extractSiren, getCseYear } from "~/modules/domain";
import { auth } from "~/server/auth";

export async function GET() {
	const session = await auth();
	if (!session?.user?.siret) {
		return new Response("Non autorisé", { status: 401 });
	}

	const siren = extractSiren(session.user.siret);
	const year = getCseYear();

	try {
		const data = await buildTransmittedPdfData(siren, new Date());
		const buffer = await renderToBuffer(TransmittedPdfDocument({ data }));
		const filename = `recapitulatif-elements-transmis-${siren}-${year + 1}.pdf`;

		return new Response(new Uint8Array(buffer), {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("[transmitted-pdf]", error);
		return new Response("Impossible de générer le PDF", { status: 400 });
	}
}
