import "server-only";

import { isIPv4, isIPv6 } from "node:net";
import { env } from "~/env";
import type { AuditCategory, AuditStatus } from "~/modules/audit";

export type ActivityLogSource = "trpc" | "route" | null;

export type EmitActivityLogParams = {
	source: ActivityLogSource;
	action: string | null;
	category: AuditCategory | null;
	route: string | null;
	operation: string | null;
	status: AuditStatus;
	errorCode: string | null;
	durationMs: number | null;
	userId: string | null;
	siren: string | null;
	ip: string | null | undefined;
	rawInput: unknown;
};

const ROUTE_MAX_LENGTH = 200;

export function emitActivityLog(params: EmitActivityLogParams): void {
	if (env.NODE_ENV === "test") return;

	try {
		const entry = {
			timestamp: new Date().toISOString(),
			level: params.status === "success" ? "info" : "warn",
			logType: "user_activity",
			source: params.source,
			action: params.action,
			category: params.category,
			route: params.route ? params.route.slice(0, ROUTE_MAX_LENGTH) : null,
			operation: params.operation,
			status: params.status,
			errorCode: params.errorCode,
			durationMs: params.durationMs,
			userId: params.userId,
			siren: params.siren,
			ip: truncateIp(params.ip),
			// tRPC input is read before Zod validation, so its values are caller-forged — keep only its key names.
			input:
				params.source === "trpc" ? null : projectInputValues(params.rawInput),
			inputKeys: projectInputKeys(params.rawInput),
		};
		console.log(JSON.stringify(entry));
	} catch (error) {
		// Swallowed: a malformed line must never block the audit.action_log insert that follows it.
		console.error("[audit] Failed to emit activity log line", { error });
	}
}

const CODE_PREFIX_PATTERN = /^([A-Z][A-Z0-9_]{0,63}):/;
const HTTP_MESSAGE_PATTERN = /^HTTP (\d{3})/;

export function deriveErrorCode(
	errorMessage: string | null | undefined,
): string | null {
	if (!errorMessage) return null;

	const codeMatch = CODE_PREFIX_PATTERN.exec(errorMessage);
	if (codeMatch?.[1]) return codeMatch[1];

	const httpMatch = HTTP_MESSAGE_PATTERN.exec(errorMessage);
	if (httpMatch?.[1]) return `HTTP_${httpMatch[1]}`;

	return "ERROR";
}

const IPV6_ZONE_SUFFIX = /%.*$/;
const IPV4_MAPPED_PATTERN = /^::ffff:([0-9a-f]{1,4}):[0-9a-f]{1,4}$/;
const TRAILING_ZERO_GROUPS = /(?:^|:)0(?::0)*$/;
const IPV6_GROUP_COUNT = 8;
const IPV6_KEPT_GROUPS = 3;

export function truncateIp(raw: string | null | undefined): string | null {
	const value = raw?.trim();
	if (!value) return null;
	if (isIPv4(value)) return truncateIpv4(value);
	if (!isIPv6(value)) return null;

	// The WHATWG URL parser serializes IPv6 in RFC 5952 form (lowercase hex, no dotted quad, one compressed run) — the only shape the expansion below handles.
	const canonical = new URL(
		`http://[${value.replace(IPV6_ZONE_SUFFIX, "")}]`,
	).hostname.slice(1, -1);

	const mapped = IPV4_MAPPED_PATTERN.exec(canonical);
	if (mapped?.[1]) {
		const highGroup = Number.parseInt(mapped[1], 16);
		return `${highGroup >> 8}.${highGroup & 0xff}.0.0`;
	}

	const keptGroups = expandIpv6(canonical).slice(0, IPV6_KEPT_GROUPS).join(":");
	return `${keptGroups.replace(TRAILING_ZERO_GROUPS, "")}::`;
}

function truncateIpv4(value: string): string {
	const [first, second] = value.split(".");
	return `${first}.${second}.0.0`;
}

function expandIpv6(canonical: string): string[] {
	const halves = canonical
		.split("::")
		.map((half) => (half === "" ? [] : half.split(":")));
	const explicitGroupCount = halves.reduce(
		(count, half) => count + half.length,
		0,
	);
	const zeroGroups = Array.from(
		{ length: IPV6_GROUP_COUNT - explicitGroupCount },
		() => "0",
	);
	return halves.flatMap((half, index) =>
		index === 0 ? [...half, ...zeroGroups] : half,
	);
}

// Extend only per the "Miroir stdout" section of .claude/rules/audit-logging.md.
const INPUT_ALLOWED_KEYS = new Set([
	"year",
	"siren",
	"id",
	"declarationId",
	"fileId",
	"step",
	"currentStep",
	"kind",
	"type",
	"slice",
	"declarationNumber",
	"page",
	"pageSize",
	"limit",
	"offset",
	"sortBy",
	"sortOrder",
	"sizeRange",
	"region",
	"county",
	"hasCse",
]);

const INPUT_KEY_NAME_PATTERN = /^\w{1,64}$/;
const INPUT_VALUE_STRING_PATTERN = /^[\w.:-]{1,64}$/;
const MAX_INPUT_KEYS = 20;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		!(value instanceof Date)
	);
}

function isAllowedPrimitive(
	value: unknown,
): value is number | boolean | string {
	if (typeof value === "number") return Number.isFinite(value);
	if (typeof value === "boolean") return true;
	if (typeof value === "string") return INPUT_VALUE_STRING_PATTERN.test(value);
	return false;
}

function projectInputKeys(rawValue: unknown): string[] | null {
	if (!isPlainRecord(rawValue)) return null;

	const keys = Object.keys(rawValue).filter((key) =>
		INPUT_KEY_NAME_PATTERN.test(key),
	);
	if (keys.length === 0) return null;

	keys.sort((left, right) => left.localeCompare(right, "en"));
	return keys.slice(0, MAX_INPUT_KEYS);
}

function projectInputValues(rawValue: unknown): Record<string, unknown> | null {
	if (!isPlainRecord(rawValue)) return null;

	const projected: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(rawValue)) {
		if (!INPUT_ALLOWED_KEYS.has(key)) continue;
		if (!isAllowedPrimitive(value)) continue;
		projected[key] = value;
	}

	return Object.keys(projected).length > 0 ? projected : null;
}
