import { env } from "~/env.js";
import { countPublicCompanySirens } from "~/server/services/publicDeclarationsService";

const COMPANY_URLS_PER_SITEMAP = 50_000;

export const dynamic = "force-dynamic";

function xmlResponse(xml: string): Response {
	return new Response(xml, {
		headers: {
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
}

export async function GET(): Promise<Response> {
	if (env.NEXT_PUBLIC_EGAPRO_ENV !== "prod") {
		return xmlResponse(
			'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>',
		);
	}
	const origin = new URL(env.NEXTAUTH_URL).origin;
	let companyCount = 0;
	try {
		companyCount = await countPublicCompanySirens();
	} catch (error) {
		// Keep the static public pages discoverable during a temporary DB outage.
		console.error(
			"[sitemap.xml] company count unavailable",
			error instanceof Error ? error.message : "unknown error",
		);
	}
	const companySitemaps = Array.from(
		{ length: Math.ceil(companyCount / COMPANY_URLS_PER_SITEMAP) },
		(_, index) =>
			`<sitemap><loc>${origin}/sitemaps/companies-${index + 1}.xml</loc></sitemap>`,
	).join("");
	return xmlResponse(
		`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${origin}/sitemaps/static.xml</loc></sitemap>${companySitemaps}</sitemapindex>`,
	);
}
