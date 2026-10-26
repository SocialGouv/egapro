import * as Sentry from "@sentry/nextjs";

export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("./sentry.server.config");
		const { env } = await import("~/env.js");
		if (env.EGAPRO_RECETTE_CAMPAIGN_YEAR !== undefined) {
			const { writeCampaignYearOverride } = await import("~/modules/domain");
			writeCampaignYearOverride(env.EGAPRO_RECETTE_CAMPAIGN_YEAR);
		}
		const { ensureBucket } = await import("~/server/services/s3");
		await ensureBucket();
	}

	if (process.env.NEXT_RUNTIME === "edge") {
		await import("./sentry.edge.config");
	}
}

export const onRequestError = Sentry.captureRequestError;
