import { describe, expect, it } from "vitest";

import {
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
