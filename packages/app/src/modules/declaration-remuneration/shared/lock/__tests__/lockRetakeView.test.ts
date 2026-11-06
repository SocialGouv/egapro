import { describe, expect, it } from "vitest";

import { isLockReleasedOrRetaking } from "../lockRetakeView";
import type { LockRetake } from "../types";

function retakeWith(
	status: LockRetake["status"],
	isAvailable: boolean,
): LockRetake {
	return { status, isAvailable, retake: () => {} };
}

describe("isLockReleasedOrRetaking", () => {
	it.each([
		{ label: "no retake", retake: undefined, expected: false },
		{
			label: "idle, still locked",
			retake: retakeWith("idle", false),
			expected: false,
		},
		{
			label: "idle, released",
			retake: retakeWith("idle", true),
			expected: true,
		},
		{
			label: "retake pending",
			retake: retakeWith("pending", false),
			expected: true,
		},
		{
			label: "outpaced by another user",
			retake: retakeWith("outpaced", false),
			expected: false,
		},
		{
			label: "failed, still locked",
			retake: retakeWith("failed", false),
			expected: false,
		},
		{
			label: "failed, released",
			retake: retakeWith("failed", true),
			expected: true,
		},
	])("returns $expected when $label", ({ retake, expected }) => {
		expect(isLockReleasedOrRetaking(retake)).toBe(expected);
	});
});
