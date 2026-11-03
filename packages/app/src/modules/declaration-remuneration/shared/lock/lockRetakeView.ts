import type { LockRetake } from "./types";

export type LockRetakeView = "available" | "outpaced" | "failed" | "succeeded";

export function resolveLockRetakeView(
	retake: LockRetake | undefined,
): LockRetakeView | null {
	if (!retake) return null;
	switch (retake.status) {
		case "succeeded":
		case "outpaced":
		case "failed":
			return retake.status;
		case "pending":
			return "available";
		case "idle":
			return retake.isAvailable ? "available" : null;
	}
}
