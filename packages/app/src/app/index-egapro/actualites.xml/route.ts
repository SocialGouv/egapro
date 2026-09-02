import { escapeXml } from "~/modules/legal";
import { enforcePublicApiRateLimit } from "~/server/services/publicApiRateLimit";
import { searchPublicDeclarations } from "~/server/services/publicDeclarationsService";

export async function GET(request: Request): Promise<Response> {
	const limited = await enforcePublicApiRateLimit(request);
	if (limited) return limited;
	const origin = new URL(request.url).origin;
	const result = await searchPublicDeclarations({
		limit: 50,
		offset: 0,
		sort: "year",
	});
	const items = result.data
		.map((item) => {
			const link = `${origin}/index-egapro/entreprise/${item.siren}`;
			const title = `${item.name ?? "Entreprise"} — résultats ${item.year}`;
			return `<item><title>${escapeXml(title)}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid><description>${escapeXml(`Publication des six indicateurs de rémunération A à F pour le SIREN ${item.siren}.`)}</description></item>`;
		})
		.join("");
	const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>EgaPro — nouvelles publications</title><link>${escapeXml(`${origin}/index-egapro/recherche`)}</link><description>Derniers résultats d’égalité professionnelle publiés sur EgaPro.</description><language>fr</language>${items}</channel></rss>`;
	return new Response(xml, {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=900, s-maxage=900",
			"Content-Type": "application/rss+xml; charset=utf-8",
		},
	});
}
