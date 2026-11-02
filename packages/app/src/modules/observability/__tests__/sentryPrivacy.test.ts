import type {
	Breadcrumb,
	ErrorEvent,
	Event,
	ReplayFrameEvent,
} from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import {
	replayEventPrivacyIntegration,
	scrubBreadcrumb,
	scrubEvent,
	scrubRecordingEvent,
	scrubSpan,
	scrubText,
	scrubUrl,
	scrubValue,
	sentryPrivacyOptions,
	sentryReplayPrivacyOptions,
} from "../sentryPrivacy";

const SIREN = "123456789";
const SIRET = "12345678900012";
const EMAIL = "email@example.fr";

describe("scrubText", () => {
	it("replaces an email address", () => {
		expect(scrubText(`contact ${EMAIL} end`)).toBe("contact [email] end");
	});

	it("replaces a plain SIREN and leaves a 10-digit number alone", () => {
		expect(scrubText("siren=123456789")).toBe("siren=[siren]");
		expect(scrubText("1234567890")).toBe("1234567890");
	});

	it("replaces a space-separated SIREN", () => {
		expect(scrubText("SIREN 123 456 789 declared")).toBe(
			"SIREN [siren] declared",
		);
	});

	it("replaces a 14-digit SIRET, plain and space-separated", () => {
		expect(scrubText(SIRET)).toBe("[siren]");
		expect(scrubText("123 456 789 00012")).toBe("[siren]");
		expect(scrubText("123 456 789 2025")).toBe("[siren] 2025");
	});

	it("replaces a SIREN inside a URL path", () => {
		expect(scrubText("/mon-espace/historique/123456789/2026")).toBe(
			"/mon-espace/historique/[siren]/2026",
		);
	});

	it("scrubs an URL-encoded tRPC input", () => {
		expect(scrubText("?input=%7B%22siren%22%3A%22123456789%22%7D")).toBe(
			'?input={"siren":"[siren]"}',
		);
	});

	it("replaces an email with accented characters", () => {
		expect(scrubText("jérôme.dupont@exemple.fr")).toBe("[email]");
	});

	it("replaces a SIREN separated by non-breaking spaces", () => {
		expect(scrubText("123\u00A0456\u00A0789")).toBe("[siren]");
		expect(scrubText("123\u202F456\u202F789")).toBe("[siren]");
	});

	it("scrubs an URL-encoded email", () => {
		expect(scrubText("email%40example.fr")).toBe("[email]");
	});

	it("scrubs raw text when the percent-encoding is invalid", () => {
		expect(scrubText("100% done for 123456789")).toBe("100% done for [siren]");
	});

	it("scrubs each valid percent-encoded sequence even next to an invalid one", () => {
		expect(scrubText("100% done ?input=%22123456789%22")).toBe(
			'100% done ?input="[siren]"',
		);
	});

	it("replaces consecutive SIRENs and one at the start of the text", () => {
		expect(scrubText("123456789,987654321")).toBe("[siren],[siren]");
	});

	it("leaves a 13-digit number alone", () => {
		expect(scrubText("1234567890123")).toBe("1234567890123");
	});
});

describe("scrubUrl", () => {
	it("drops the query string and the fragment before scrubbing the path", () => {
		expect(
			scrubUrl(
				"https://x.fr/mon-espace/historique/123456789?code=abc&state=def#top",
			),
		).toBe("https://x.fr/mon-espace/historique/[siren]");
	});
});

describe("scrubValue", () => {
	it("scrubs strings nested in objects and arrays, leaving other values intact", () => {
		expect(
			scrubValue({
				message: EMAIL,
				nested: { list: ["siren=123456789", 42, null, true] },
				count: 3,
			}),
		).toEqual({
			message: "[email]",
			nested: { list: ["siren=[siren]", 42, null, true] },
			count: 3,
		});
	});

	it("replaces a numeric SIREN or SIRET and leaves other numbers alone", () => {
		expect(scrubValue({ siren: 123456789, siret: 12345678900012 })).toEqual({
			siren: "[siren]",
			siret: "[siren]",
		});
		expect(scrubValue({ count: 1234567890, ratio: 0.5 })).toEqual({
			count: 1234567890,
			ratio: 0.5,
		});
	});

	it("scrubs a SIREN or an email under a generic id key, suffix included", () => {
		expect(scrubValue({ id: SIREN, companyId: SIREN, userId: EMAIL })).toEqual({
			id: "[siren]",
			companyId: "[siren]",
			userId: "[email]",
		});
	});

	it("scrubs non-string values nested under identifier keys", () => {
		expect(
			scrubValue({
				id: { email: EMAIL },
				trace_id: { siren: SIREN },
				span_id: [SIREN],
				parent_span_id: 123456789,
			}),
		).toEqual({
			id: { email: "[email]" },
			trace_id: { siren: "[siren]" },
			span_id: ["[siren]"],
			parent_span_id: "[siren]",
		});
	});

	it("keeps identifier keys intact so traces stay linked", () => {
		const ids = {
			trace_id: "1234567890abcdef123456789abcdef0",
			span_id: "123456789abcdef0",
			"sentry.segment.id": "123456789abcdef0",
			replayId: "123456789abcdef0",
			"sentry.release": "abc123456789def",
		};

		expect(scrubValue({ trace: ids })).toEqual({ trace: ids });
	});

	it("passes through non-string scalars", () => {
		expect(scrubValue("email@example.fr")).toBe("[email]");
		expect(scrubValue(42)).toBe(42);
		expect(scrubValue(null)).toBe(null);
		expect(scrubValue(undefined)).toBe(undefined);
	});
});

function buildEvent(): ErrorEvent {
	return {
		type: undefined,
		message: `failed for ${EMAIL}`,
		transaction: "/mon-espace/historique/123456789",
		user: { email: EMAIL, id: "u1" },
		request: {
			url: "https://egapro.travail.gouv.fr/mon-espace/historique/123456789/2026",
			query_string: "?input=%7B%22siren%22%3A%22123456789%22%7D",
			cookies: { session: "abc" },
			data: { siren: SIREN },
			headers: {
				Cookie: "session=abc",
				AUTHORIZATION: "Bearer token",
				"Content-Type": EMAIL,
			},
		},
		logentry: { message: "refused %s", params: [EMAIL] },
		exception: {
			values: [
				{
					type: "Error",
					value: `siren ${SIREN} refused`,
					mechanism: { type: "generic", data: { siren: SIREN } },
					stacktrace: { frames: [{ filename: "/_next/123456789.js" }] },
				},
			],
		},
		breadcrumbs: [
			{
				category: "console",
				message: `siren=${SIREN}`,
				data: { arguments: [EMAIL] },
			},
			{
				category: "navigation",
				data: { from: `/a/${SIREN}?x=1`, to: `/b?email=${EMAIL}` },
			},
		],
		extra: { context: { siren: SIREN } },
		contexts: { custom: { url: `https://x.fr/${SIREN}` } },
		tags: { siren: SIREN },
	};
}

describe("scrubEvent", () => {
	it("removes user, cookies, query string, sensitive headers and data", () => {
		const scrubbed = scrubEvent(buildEvent());

		expect(scrubbed.user).toBeUndefined();
		expect(scrubbed.request?.cookies).toBeUndefined();
		expect(scrubbed.request?.data).toBeUndefined();
		expect(scrubbed.request?.query_string).toBeUndefined();
		expect(scrubbed.request?.headers).toEqual({ "Content-Type": "[email]" });
	});

	it("scrubs message, logentry, transaction, url, exception values, extra, contexts and tags", () => {
		const scrubbed = scrubEvent(buildEvent());

		expect(scrubbed.message).toBe("failed for [email]");
		expect(scrubbed.transaction).toBe("/mon-espace/historique/[siren]");
		expect(scrubbed.request?.url).toBe(
			"https://egapro.travail.gouv.fr/mon-espace/historique/[siren]/2026",
		);
		expect(scrubbed.logentry).toEqual({
			message: "refused %s",
			params: ["[email]"],
		});
		expect(scrubbed.exception?.values?.[0]?.value).toBe(
			"siren [siren] refused",
		);
		expect(scrubbed.exception?.values?.[0]?.mechanism?.data).toEqual({
			siren: "[siren]",
		});
		expect(scrubbed.extra).toEqual({ context: { siren: "[siren]" } });
		expect(scrubbed.contexts).toEqual({
			custom: { url: "https://x.fr/[siren]" },
		});
		expect(scrubbed.tags).toEqual({ siren: "[siren]" });
	});

	it("leaves stack frames untouched so source maps still resolve", () => {
		const scrubbed = scrubEvent(buildEvent());

		expect(scrubbed.exception?.values?.[0]?.stacktrace).toEqual({
			frames: [{ filename: "/_next/123456789.js" }],
		});
	});

	it("scrubs console breadcrumbs with their data", () => {
		const scrubbed = scrubEvent(buildEvent());

		expect(scrubbed.breadcrumbs?.[0]?.message).toBe("siren=[siren]");
		expect(scrubbed.breadcrumbs?.[0]?.data).toEqual({ arguments: ["[email]"] });
	});

	it("drops the query string of navigation breadcrumbs", () => {
		const scrubbed = scrubEvent(buildEvent());

		expect(scrubbed.breadcrumbs?.[1]?.data).toEqual({
			from: "/a/[siren]",
			to: "/b",
		});
	});

	it("leaves a minimal event untouched beyond the removals", () => {
		const scrubbed = scrubEvent({ type: undefined, level: "error" });

		expect(scrubbed.level).toBe("error");
	});
});

describe("scrubBreadcrumb", () => {
	it("scrubs message and data of a console breadcrumb", () => {
		const breadcrumb: Breadcrumb = {
			category: "console",
			message: `failed: siren ${SIREN}`,
			data: { arguments: [EMAIL, "123 456 789"] },
			timestamp: 1,
		};

		expect(scrubBreadcrumb(breadcrumb)).toEqual({
			category: "console",
			message: "failed: siren [siren]",
			data: { arguments: ["[email]", "[siren]"] },
			timestamp: 1,
		});
	});

	it("keeps a breadcrumb without message or data unchanged", () => {
		const breadcrumb: Breadcrumb = { category: "ui.click", level: "info" };

		expect(scrubBreadcrumb(breadcrumb)).toStrictEqual({
			category: "ui.click",
			level: "info",
		});
	});
});

describe("scrubSpan", () => {
	it("scrubs the span name and attributes, dropping query strings", () => {
		const scrubbed = scrubSpan({
			trace_id: "1234567890abcdef123456789abcdef0",
			span_id: "123456789abcdef0",
			name: `GET /index-egapro/entreprise/${SIREN}`,
			start_timestamp: 0,
			status: "ok",
			is_segment: true,
			attributes: {
				"url.full": `https://x.fr/api/trpc/a?input=%7B%22siren%22%3A%22${SIREN}%22%7D`,
				"url.query": `input=${SIREN}`,
				"url.fragment": "top",
				"http.request.body.data": `{"siren":"${SIREN}"}`,
				"url.path": `/entreprise/${SIREN}`,
				"sentry.segment.id": "123456789abcdef0",
			},
		});

		expect(scrubbed.name).toBe("GET /index-egapro/entreprise/[siren]");
		expect(scrubbed.trace_id).toBe("1234567890abcdef123456789abcdef0");
		expect(scrubbed.attributes).toEqual({
			"url.full": "https://x.fr/api/trpc/a",
			"url.path": "/entreprise/[siren]",
			"sentry.segment.id": "123456789abcdef0",
		});
	});
});

describe("replayEventPrivacyIntegration", () => {
	it("scrubs the urls and request of a replay event", () => {
		const replayEvent = {
			type: "replay_event",
			urls: [`https://x.fr/mon-espace/historique/${SIREN}?a=1`],
			request: { url: `https://x.fr/index-egapro/entreprise/${SIREN}` },
		} as Event;

		expect(
			replayEventPrivacyIntegration.processEvent?.(
				replayEvent,
				{},
				undefined as never,
			),
		).toEqual({
			type: "replay_event",
			urls: ["https://x.fr/mon-espace/historique/[siren]"],
			request: { url: "https://x.fr/index-egapro/entreprise/[siren]" },
		});
	});

	it("leaves other events to beforeSend", () => {
		const errorEvent: Event = { type: undefined, message: EMAIL };

		expect(
			replayEventPrivacyIntegration.processEvent?.(
				errorEvent,
				{},
				undefined as never,
			),
		).toBe(errorEvent);
	});
});

describe("scrubRecordingEvent", () => {
	it("drops query strings from URLs carried by performance spans", () => {
		const event: ReplayFrameEvent = {
			type: 5,
			timestamp: 1,
			data: {
				tag: "performanceSpan",
				payload: {
					op: "navigation.push",
					description: "https://x.fr/admin/declarations?email=jean@x.fr&q=Jean",
					startTimestamp: 1,
					endTimestamp: 2,
					data: { previous: "/admin?token=ZZ" },
				},
			},
		};

		expect(scrubRecordingEvent(event)).toEqual({
			type: 5,
			timestamp: 1,
			data: {
				tag: "performanceSpan",
				payload: {
					op: "navigation.push",
					description: "https://x.fr/admin/declarations",
					startTimestamp: 1,
					endTimestamp: 2,
					data: { previous: "/admin" },
				},
			},
		});
	});

	it("scrubs custom recording events", () => {
		const event: ReplayFrameEvent = {
			type: 5,
			timestamp: 1,
			data: {
				tag: "breadcrumb",
				payload: {
					type: "default",
					category: "console",
					level: "error",
					message: `siren=${SIREN}`,
					data: { logger: "console", arguments: [EMAIL] },
					timestamp: 1,
				},
			},
		};

		expect(scrubRecordingEvent(event)).toEqual({
			type: 5,
			timestamp: 1,
			data: {
				tag: "breadcrumb",
				payload: {
					type: "default",
					category: "console",
					level: "error",
					message: "siren=[siren]",
					data: { logger: "console", arguments: ["[email]"] },
					timestamp: 1,
				},
			},
		});
	});
});

describe("sentryPrivacyOptions", () => {
	it("disables every PII-bearing collection switch", () => {
		expect(sentryPrivacyOptions.dataCollection).toEqual({
			userInfo: false,
			cookies: false,
			httpHeaders: false,
			httpBodies: [],
			urlQueryParams: false,
			stackFrameVariables: false,
			databaseQueryData: false,
			queues: false,
		});
	});

	it("wires the scrubbers as the SDK callbacks", () => {
		expect(sentryPrivacyOptions.beforeSend).toBe(scrubEvent);
		expect(sentryPrivacyOptions.beforeSendSpan).toBe(scrubSpan);
		expect(sentryPrivacyOptions.beforeBreadcrumb).toBe(scrubBreadcrumb);
	});
});

describe("sentryReplayPrivacyOptions", () => {
	it("masks all text, inputs, media and link targets, and captures no network detail", () => {
		expect(sentryReplayPrivacyOptions).toEqual({
			maskAllText: true,
			maskAllInputs: true,
			blockAllMedia: true,
			maskAttributes: ["title", "placeholder", "aria-label", "href", "action"],
			networkDetailAllowUrls: [],
			networkCaptureBodies: false,
			beforeAddRecordingEvent: scrubRecordingEvent,
		});
	});
});
