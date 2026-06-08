import "server-only";

import { env } from "~/env";

export type MatomoEventsReportRow = {
	label: string;
	nb_events: number;
	nb_visits?: number;
	nb_events_with_value?: number;
	sum_event_value?: number;
	avg_event_value?: number;
	min_event_value?: number;
	max_event_value?: number;
	idsubdatatable?: number;
};

type FetchMatomoEventsReportParams = {
	method: string;
	period: string;
	date: string;
	segment?: string;
};

const REQUEST_TIMEOUT_MS = 10_000;

function isMatomoApiError(data: unknown): data is { message?: string } {
	return (
		typeof data === "object" &&
		data !== null &&
		"result" in data &&
		(data as { result?: unknown }).result === "error"
	);
}

export async function fetchMatomoEventsReport({
	method,
	period,
	date,
	segment,
}: FetchMatomoEventsReportParams): Promise<MatomoEventsReportRow[]> {
	const baseUrl = env.NEXT_PUBLIC_MATOMO_URL;
	const siteId = env.NEXT_PUBLIC_MATOMO_SITE_ID;
	const token = env.MATOMO_API_TOKEN;

	if (!baseUrl || !siteId || !token) {
		throw new Error("Matomo non configuré");
	}

	const url = new URL(`${baseUrl.replace(/\/$/, "")}/index.php`);
	url.searchParams.set("module", "API");
	url.searchParams.set("format", "json");
	url.searchParams.set("idSite", siteId);
	url.searchParams.set("method", method);
	url.searchParams.set("period", period);
	url.searchParams.set("date", date);
	if (segment) url.searchParams.set("segment", segment);

	// `token_auth` goes in the POST body, never the URL, so it cannot leak via
	// access logs, the Referer header, or an error message that echoes the URL.
	const body = new URLSearchParams({ token_auth: token });

	let response: Response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
	} catch {
		throw new Error("Matomo Reporting API request failed");
	}

	if (!response.ok) {
		throw new Error(
			`Matomo Reporting API error: ${response.status} ${response.statusText}`,
		);
	}

	let data: unknown;
	try {
		data = await response.json();
	} catch {
		throw new Error("Matomo Reporting API returned a non-JSON response");
	}

	if (isMatomoApiError(data)) {
		throw new Error("Matomo Reporting API returned an error response");
	}

	return data as MatomoEventsReportRow[];
}
