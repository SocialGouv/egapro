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

// Silenced under Vitest (NODE_ENV=test) — the dev server and every deployed image emit normally.
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
			input: projectInputValues(params.rawInput),
			inputKeys: projectInputKeys(params.rawInput),
		};
		console.log(JSON.stringify(entry));
	} catch (error) {
		// A malformed entry must never block logAction's DB insert (S8).
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

export function truncateIp(raw: string | null | undefined): string | null {
	if (!raw) return null;
	const value = raw.trim();
	if (!value) return null;

	if (isIPv4(value)) return truncateIpv4(value);

	if (isIPv6(value)) {
		const groups = expandIpv6(value);
		if (!groups) return null;

		const mappedIpv4 = ipv4FromMappedGroups(groups);
		if (mappedIpv4) return truncateIpv4(mappedIpv4);

		return formatCompressedIpv6([
			groups[0] ?? 0,
			groups[1] ?? 0,
			groups[2] ?? 0,
		]);
	}

	return null;
}

function truncateIpv4(value: string): string {
	const [a, b] = value.split(".");
	return `${a}.${b}.0.0`;
}

function expandIpv6(address: string): number[] | null {
	const withoutZone = address.split("%")[0];
	if (!withoutZone) return null;

	const parts = withoutZone.split("::");
	if (parts.length > 2) return null;

	if (parts.length === 1) {
		const groups = parseIpv6Segment(parts[0] ?? "");
		return groups && groups.length === 8 ? groups : null;
	}

	const left = parseIpv6Segment(parts[0] ?? "");
	const right = parseIpv6Segment(parts[1] ?? "");
	if (!left || !right) return null;

	const missing = 8 - left.length - right.length;
	if (missing < 0) return null;

	return [...left, ...Array(missing).fill(0), ...right];
}

function parseIpv6Segment(segment: string): number[] | null {
	if (segment === "") return [];

	const pieces = segment.split(":");
	const groups: number[] = [];

	for (const [index, piece] of pieces.entries()) {
		if (index === pieces.length - 1 && piece.includes(".")) {
			if (!isIPv4(piece)) return null;
			const octets = piece.split(".").map(Number);
			groups.push(((octets[0] ?? 0) << 8) | (octets[1] ?? 0));
			groups.push(((octets[2] ?? 0) << 8) | (octets[3] ?? 0));
			continue;
		}
		if (!/^[0-9a-fA-F]{1,4}$/.test(piece)) return null;
		groups.push(Number.parseInt(piece, 16));
	}

	return groups;
}

function ipv4FromMappedGroups(groups: number[]): string | null {
	if (
		!groups.slice(0, 5).every((group) => group === 0) ||
		groups[5] !== 0xffff
	) {
		return null;
	}
	const g6 = groups[6] ?? 0;
	const g7 = groups[7] ?? 0;
	return [(g6 >> 8) & 0xff, g6 & 0xff, (g7 >> 8) & 0xff, g7 & 0xff].join(".");
}

// The 5 trailing groups of a truncated /48 are always zero, so there is always a run to compress — no uncompressed fallback needed here.
function formatCompressedIpv6(keptGroups: [number, number, number]): string {
	let compressFrom: number = keptGroups.length;
	for (let i = keptGroups.length - 1; i >= 0 && keptGroups[i] === 0; i--) {
		compressFrom = i;
	}
	const printed = keptGroups
		.slice(0, compressFrom)
		.map((group) => group.toString(16));
	return `${printed.join(":")}::`;
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

const INPUT_KEY_NAME_PATTERN = /^[A-Za-z0-9_]{1,64}$/;
const INPUT_VALUE_STRING_PATTERN = /^[A-Za-z0-9_.:-]{1,64}$/;
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

	return keys.sort().slice(0, MAX_INPUT_KEYS);
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
