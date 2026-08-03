import { NextResponse } from "next/server";
import { env } from "~/env.js";
import { e2eClockSchema } from "~/modules/declaration";
import { getCurrentYear } from "~/modules/domain";

/**
 * Test-only campaign-clock control (issue #4022). Writes the shared
 * globalThis.__egaproCampaignYear override that getCurrentYear() reads, so the
 * E2E recette grid can pilot the campaign year across every server call and
 * every browser bundle without a rebuild.
 *
 * EGAPRO_E2E_CLOCK alone gates the route: it 404s unless the flag is enabled,
 * and the flag is declared in no .kontinuous env config, so it is never set in
 * preproduction or production — verifiable with a single grep.
 *
 * An earlier revision also required NODE_ENV !== "production". That second lock
 * added nothing the flag did not already give, and it forbade the intended use:
 * every CI run — the PR gate and the nightly grid alike — serves a production
 * build (`next build` then `next start`), so the route 404ed in the only
 * environments that need it. Do not reinstate it; gate on the flag.
 *
 * No withAuditedRoute wrapper: the route is unreachable in production, and a
 * recette run posts it up to 185 times — logging those would pollute
 * audit.action_log for zero compliance value.
 */

type CampaignClockGlobal = { __egaproCampaignYear?: number };

function isDisabled(): boolean {
	return !env.EGAPRO_E2E_CLOCK;
}

export async function POST(request: Request): Promise<Response> {
	if (isDisabled()) return new NextResponse(null, { status: 404 });

	const body = await request.json().catch(() => null);
	const parsed = e2eClockSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message },
			{ status: 400 },
		);
	}

	(globalThis as CampaignClockGlobal).__egaproCampaignYear =
		parsed.data.campaignYear;
	return NextResponse.json({ campaignYear: parsed.data.campaignYear });
}

export async function DELETE(): Promise<Response> {
	if (isDisabled()) return new NextResponse(null, { status: 404 });

	delete (globalThis as CampaignClockGlobal).__egaproCampaignYear;
	return NextResponse.json({ campaignYear: getCurrentYear() });
}

export async function GET(): Promise<Response> {
	if (isDisabled()) return new NextResponse(null, { status: 404 });

	return NextResponse.json({ campaignYear: getCurrentYear() });
}
