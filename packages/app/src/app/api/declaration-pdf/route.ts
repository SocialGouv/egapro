import { renderToBuffer } from "@react-pdf/renderer";
import { buildPdfData } from "~/modules/declarationPdf/buildPdfData";
import { DeclarationPdfDocument } from "~/modules/declarationPdf/DeclarationPdfDocument";
import { extractSiren, getCurrentYear } from "~/modules/domain";
import { auth } from "~/server/auth";

export async function GET() {
	const session = await auth();
	if (!session?.user?.siret) {
		return new Response("Non autorisé", { status: 401 });
	}

	const siren = extractSiren(session.user.siret);
	const year = getCurrentYear();

	try {
		const data = await buildPdfData(siren, year, new Date());
		const buffer = await renderToBuffer(DeclarationPdfDocument({ data }));
		const filename = `declaration-remuneration-${siren}-${year}.pdf`;

		return new Response(new Uint8Array(buffer), {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("[declaration-pdf]", error);
		return new Response("Impossible de générer le PDF", { status: 400 });
	}
}
