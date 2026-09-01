import { env } from "~/env.js";
import { buildSitemap } from "~/modules/legal";
import { listPublicCompanySirens } from "~/server/services/publicDeclarationsService";

const COMPANY_URLS_PER_SITEMAP = 50_000;

// Same reason as sitemap.xml: NEXTAUTH_URL is a runtime variable, undefined in
// the Docker/CI build where SKIP_ENV_VALIDATION applies.
export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}

function urlSet(entries: Array<{ url: string; lastModified?: string | Date }>) {
	const urls = entries
		.map(
			(entry) =>
				`<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>` : ""}</url>`,
		)
		.join("");
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
		{
			headers: {
				"Cache-Control": "public, max-age=3600, s-maxage=3600",
				"Content-Type": "application/xml; charset=utf-8",
			},
		},
	);
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ segment: string }> },
): Promise<Response> {
	if (env.NEXT_PUBLIC_EGAPRO_ENV !== "prod") return urlSet([]);
	const { segment } = await params;
	if (segment === "static.xml") {
		return urlSet(buildSitemap(env.NEXTAUTH_URL, true));
	}
	const match = /^companies-(\d+)\.xml$/.exec(segment);
	if (!match) return new Response("Not found", { status: 404 });
	const page = Number(match[1]);
	if (!Number.isSafeInteger(page) || page < 1) {
		return new Response("Not found", { status: 404 });
	}
	const sirens = await listPublicCompanySirens(
		COMPANY_URLS_PER_SITEMAP,
		(page - 1) * COMPANY_URLS_PER_SITEMAP,
	);
	if (sirens.length === 0) return new Response("Not found", { status: 404 });
	const origin = new URL(env.NEXTAUTH_URL).origin;
	return urlSet(
		sirens.map((siren) => ({
			url: `${origin}/index-egapro/entreprise/${siren}`,
		})),
	);
}
