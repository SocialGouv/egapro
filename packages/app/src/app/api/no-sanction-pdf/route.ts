import { renderToBuffer } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { extractSiren, formatLongDate } from "~/modules/domain";
import { NoSanctionPdfDocument } from "~/modules/noSanctionAttestation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { companies } from "~/server/db/schema";
import { fetchSanctionBySiren } from "~/server/services/suit";

export async function GET() {
	const session = await auth();
	if (!session?.user?.siret) {
		return new Response("Non autorisé", { status: 401 });
	}

	const siren = extractSiren(session.user.siret);

	try {
		const sanctionStatus = await fetchSanctionBySiren(siren);
		if (sanctionStatus?.hasSanction) {
			return new Response(
				"Attestation non disponible : une sanction est en cours",
				{ status: 403 },
			);
		}

		const rows = await db
			.select({
				name: companies.name,
				address: companies.address,
			})
			.from(companies)
			.where(eq(companies.siren, siren))
			.limit(1);

		const company = rows[0];
		if (!company) {
			return new Response("Entreprise introuvable", { status: 404 });
		}

		const buffer = await renderToBuffer(
			NoSanctionPdfDocument({
				data: {
					companyName: company.name,
					siren,
					address: company.address,
					generatedAt: formatLongDate(new Date()),
				},
			}),
		);

		const filename = `attestation-non-sanction-${siren}.pdf`;

		return new Response(new Uint8Array(buffer), {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("[no-sanction-pdf]", error);
		return new Response("Impossible de générer le PDF", { status: 500 });
	}
}
