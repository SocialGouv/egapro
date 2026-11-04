import { describe, expect, it } from "vitest";

import {
	computeLockTimeoutMinutes,
	DEFAULT_LOCK_TIMEOUT_MINUTES,
	LOCK_HEARTBEAT_INTERVAL_MS,
} from "~/modules/domain";
import {
	DEFAULT_LOCK_TIMEOUT_MINUTES as DEFAULT_FROM_SOURCE,
	LOCK_HEARTBEAT_INTERVAL_MS as INTERVAL_FROM_SOURCE,
} from "../shared/declarationLock";

describe("declaration lock constants", () => {
	it("defaults the lock timeout to 30 minutes", () => {
		expect(DEFAULT_LOCK_TIMEOUT_MINUTES).toBe(30);
	});

	it("sets the heartbeat interval to 10 seconds", () => {
		expect(LOCK_HEARTBEAT_INTERVAL_MS).toBe(10_000);
	});

	it("heartbeat interval is well below the lock timeout window", () => {
		expect(LOCK_HEARTBEAT_INTERVAL_MS).toBeLessThan(
			DEFAULT_LOCK_TIMEOUT_MINUTES * 60_000,
		);
	});

	it("re-exports the same values through the domain barrel", () => {
		expect(DEFAULT_LOCK_TIMEOUT_MINUTES).toBe(DEFAULT_FROM_SOURCE);
		expect(LOCK_HEARTBEAT_INTERVAL_MS).toBe(INTERVAL_FROM_SOURCE);
	});
});

describe("computeLockTimeoutMinutes", () => {
	const HEARTBEAT = new Date("2026-11-03T10:00:00.000Z");
	const minutesAfterHeartbeat = (minutes: number) =>
		new Date(HEARTBEAT.getTime() + minutes * 60_000);

	it("reads the timeout the lock was last renewed with", () => {
		expect(
			computeLockTimeoutMinutes(HEARTBEAT, minutesAfterHeartbeat(45)),
		).toBe(45);
		expect(computeLockTimeoutMinutes(HEARTBEAT, minutesAfterHeartbeat(1))).toBe(
			1,
		);
	});

	it("absorbs sub-minute drift between the two timestamps", () => {
		const expiry = new Date(minutesAfterHeartbeat(30).getTime() + 400);

		expect(computeLockTimeoutMinutes(HEARTBEAT, expiry)).toBe(30);
	});
});
