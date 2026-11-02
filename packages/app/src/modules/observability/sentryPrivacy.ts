import type * as Sentry from "@sentry/nextjs";
import type {
	Breadcrumb,
	Event,
	ReplayFrameEvent,
	RequestEventData,
} from "@sentry/nextjs";

type InitOptions = Parameters<typeof Sentry.init>[0];
type ReplayOptions = NonNullable<
	Parameters<typeof Sentry.replayIntegration>[0]
>;
type StreamedSpan = Parameters<NonNullable<InitOptions["beforeSendSpan"]>>[0];
type Integration = Extract<
	NonNullable<InitOptions["integrations"]>,
	unknown[]
>[number];
type Exception = NonNullable<NonNullable<Event["exception"]>["values"]>[number];

type PrivacyOptions = Pick<
	InitOptions,
	"beforeSend" | "beforeSendSpan" | "beforeBreadcrumb" | "dataCollection"
>;

const EMAIL_PATTERN =
	/[\p{L}\p{N}._%+-]{1,64}@[\p{L}\p{N}.-]{1,255}\.\p{L}{2,24}/gu;

// No lookbehind: Safari < 16.4 rejects it at parse time, before Sentry starts.
const SIREN_SIRET_PATTERN =
	/(^|\D)(?:\d{14}|\d{3}[ \u00A0\u202F]\d{3}[ \u00A0\u202F]\d{3}[ \u00A0\u202F]\d{5}|\d{9}|\d{3}[ \u00A0\u202F]\d{3}[ \u00A0\u202F]\d{3})(?!\d)/g;

const PERCENT_ENCODED_PATTERN = /(?:%[0-9A-Fa-f]{2})+/g;

// Exact SDK keys whose string values are hex correlation ids the SIREN pattern would otherwise mask.
const IDENTIFIER_KEYS = new Set([
	"trace_id",
	"span_id",
	"parent_span_id",
	"profile_id",
	"event_id",
	"replay_id",
	"replayId",
	"release",
	"sentry.release",
	"sentry.segment.id",
	"sentry.replay_id",
	"sentry.profile_id",
	"sentry.profiler_id",
]);

const URL_LIKE_PATTERN = /^(?:https?:\/\/|\/)/;

const SIREN_LIKE_INTEGER = /^(?:\d{9}|\d{14})$/;

const SENSITIVE_HEADERS = new Set(["cookie", "authorization"]);

const BREADCRUMB_URL_KEYS = ["url", "from", "to"];

const SPAN_URL_KEYS = [
	"url.full",
	"http.url",
	"http.target",
	"browser.web_vital.lcp.url",
];

const SPAN_DROPPED_KEYS = new Set([
	"url.query",
	"http.query",
	"url.fragment",
	"http.fragment",
	"http.request.body.data",
]);

export function scrubText(text: string): string {
	return decode(text)
		.replace(EMAIL_PATTERN, "[email]")
		.replace(SIREN_SIRET_PATTERN, "$1[siren]");
}

export function scrubUrl(url: string): string {
	return scrubText(url.split(/[?#]/, 1)[0] ?? "");
}

export function scrubValue<T>(
	value: T,
	scrubString: (text: string) => string = scrubText,
): T {
	if (typeof value === "string") {
		return scrubString(value) as T;
	}
	if (typeof value === "number" && SIREN_LIKE_INTEGER.test(value.toString())) {
		return "[siren]" as T;
	}
	if (Array.isArray(value)) {
		return value.map((entry) => scrubValue(entry, scrubString)) as T;
	}
	if (isPlainObject(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([key, entry]) => [
				key,
				typeof entry === "string" && IDENTIFIER_KEYS.has(key)
					? entry
					: scrubValue(entry, scrubString),
			]),
		) as T;
	}
	return value;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
	return {
		...breadcrumb,
		...(breadcrumb.message === undefined
			? {}
			: { message: scrubText(breadcrumb.message) }),
		...(breadcrumb.data === undefined
			? {}
			: {
					data: scrubUrlFields(
						scrubValue(breadcrumb.data),
						BREADCRUMB_URL_KEYS,
					),
				}),
	};
}

export function scrubEvent<E extends Event>(event: E): E {
	const { user: _user, ...rest } = event;
	const urls = "urls" in event ? event.urls : undefined;

	return {
		...rest,
		...(event.message === undefined
			? {}
			: { message: scrubText(event.message) }),
		...(event.logentry === undefined
			? {}
			: { logentry: scrubValue(event.logentry) }),
		...(event.transaction === undefined
			? {}
			: { transaction: scrubText(event.transaction) }),
		...(event.request === undefined
			? {}
			: { request: scrubRequest(event.request) }),
		...(event.exception?.values === undefined
			? {}
			: { exception: { values: event.exception.values.map(scrubException) } }),
		...(event.breadcrumbs === undefined
			? {}
			: { breadcrumbs: event.breadcrumbs.map(scrubBreadcrumb) }),
		...(event.extra === undefined ? {} : { extra: scrubValue(event.extra) }),
		...(event.contexts === undefined
			? {}
			: { contexts: scrubValue(event.contexts) }),
		...(event.tags === undefined ? {} : { tags: scrubValue(event.tags) }),
		...(Array.isArray(urls)
			? {
					urls: urls.map((url: unknown) =>
						typeof url === "string" ? scrubUrl(url) : url,
					),
				}
			: {}),
	} as E;
}

export function scrubSpan(span: StreamedSpan): StreamedSpan {
	const attributes = scrubUrlFields(scrubValue(span.attributes), SPAN_URL_KEYS);

	return {
		...span,
		name: scrubText(span.name),
		attributes: Object.fromEntries(
			Object.entries(attributes).filter(([key]) => !SPAN_DROPPED_KEYS.has(key)),
		) as StreamedSpan["attributes"],
	};
}

export function scrubRecordingEvent(event: ReplayFrameEvent): ReplayFrameEvent {
	return scrubValue(event, scrubUrlOrText);
}

function scrubUrlOrText(text: string): string {
	return URL_LIKE_PATTERN.test(text) ? scrubUrl(text) : scrubText(text);
}

function scrubRequest(request: RequestEventData): RequestEventData {
	const {
		cookies: _cookies,
		data: _data,
		query_string: _queryString,
		...rest
	} = request;

	return {
		...rest,
		...(request.url === undefined ? {} : { url: scrubUrl(request.url) }),
		...(request.headers === undefined
			? {}
			: { headers: scrubHeaders(request.headers) }),
	};
}

function scrubHeaders(headers: Record<string, string>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(headers)
			.filter(([name]) => !SENSITIVE_HEADERS.has(name.toLowerCase()))
			.map(([name, value]) => [name, scrubValue(value)]),
	);
}

function scrubException(exception: Exception): Exception {
	const { stacktrace, ...rest } = exception;

	return {
		...scrubValue(rest),
		...(stacktrace === undefined ? {} : { stacktrace }),
	};
}

function scrubUrlFields<T extends Record<string, unknown>>(
	record: T,
	keys: readonly string[],
): T {
	return Object.fromEntries(
		Object.entries(record).map(([key, entry]) => [
			key,
			keys.includes(key) && typeof entry === "string" ? scrubUrl(entry) : entry,
		]),
	) as T;
}

export const sentryPrivacyOptions: PrivacyOptions = {
	// Sentry 11 replaced `sendDefaultPii` with these switches, all on by default.
	dataCollection: {
		userInfo: false,
		cookies: false,
		httpHeaders: false,
		httpBodies: [],
		urlQueryParams: false,
		stackFrameVariables: false,
		databaseQueryData: false,
		queues: false,
	},
	beforeSend: scrubEvent,
	beforeSendSpan: scrubSpan,
	beforeBreadcrumb: scrubBreadcrumb,
};

export const sentryReplayPrivacyOptions: ReplayOptions = {
	maskAllText: true,
	maskAllInputs: true,
	blockAllMedia: true,
	maskAttributes: ["title", "placeholder", "aria-label", "href", "action"],
	networkDetailAllowUrls: [],
	networkCaptureBodies: false,
	beforeAddRecordingEvent: scrubRecordingEvent,
};

// Replay events skip `beforeSend`, but not the client's event processors.
export const replayEventPrivacyIntegration: Integration = {
	name: "ReplayEventPrivacy",
	processEvent: (event) =>
		event.type === "replay_event" ? scrubEvent(event) : event,
};

function decode(text: string): string {
	return text.replace(PERCENT_ENCODED_PATTERN, (sequence) => {
		try {
			return decodeURIComponent(sequence);
		} catch {
			return sequence;
		}
	});
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
