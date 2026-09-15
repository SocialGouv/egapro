import { describe, expect, it } from "vitest";

import { DECLARATION_LOCK_CONFLICT_MESSAGE } from "~/modules/domain";

import {
	formatLockConflictMessage,
	formatLockHolderIdentity,
} from "../lockHolderIdentity";

describe("formatLockHolderIdentity", () => {
	it("formats the full name with the email in parentheses", () => {
		expect(
			formatLockHolderIdentity({
				firstName: "Camille",
				lastName: "Martin",
				email: "camille.martin@example.fr",
			}),
		).toBe("Camille Martin (camille.martin@example.fr)");
	});

	it("falls back to the name alone when the email is missing", () => {
		expect(
			formatLockHolderIdentity({
				firstName: "Camille",
				lastName: "Martin",
				email: null,
			}),
		).toBe("Camille Martin");
	});

	it("falls back to the email alone when the name is missing", () => {
		expect(
			formatLockHolderIdentity({
				firstName: null,
				lastName: null,
				email: "camille.martin@example.fr",
			}),
		).toBe("camille.martin@example.fr");
	});

	it("uses the available name part when only one of first/last is set", () => {
		expect(
			formatLockHolderIdentity({
				firstName: "Camille",
				lastName: null,
				email: "camille.martin@example.fr",
			}),
		).toBe("Camille (camille.martin@example.fr)");
	});

	it("returns null when neither name nor email is available", () => {
		expect(
			formatLockHolderIdentity({
				firstName: null,
				lastName: null,
				email: null,
			}),
		).toBeNull();
	});

	it("returns null when the holder is null", () => {
		expect(formatLockHolderIdentity(null)).toBeNull();
	});
});

describe("formatLockConflictMessage", () => {
	it("names the holder when a full identity is available", () => {
		expect(
			formatLockConflictMessage({
				firstName: "Camille",
				lastName: "Martin",
				email: "camille.martin@example.fr",
			}),
		).toBe(
			"Déclaration verrouillée par Camille Martin (camille.martin@example.fr).",
		);
	});

	it("names the holder by email alone when no name is available", () => {
		expect(
			formatLockConflictMessage({
				firstName: null,
				lastName: null,
				email: "camille.martin@example.fr",
			}),
		).toBe("Déclaration verrouillée par camille.martin@example.fr.");
	});

	it("falls back to the untouched sentinel message when the holder is null", () => {
		expect(formatLockConflictMessage(null)).toBe(
			DECLARATION_LOCK_CONFLICT_MESSAGE,
		);
	});

	it("falls back to the untouched sentinel message when the holder has no exploitable identity", () => {
		expect(
			formatLockConflictMessage({
				firstName: null,
				lastName: null,
				email: null,
			}),
		).toBe(DECLARATION_LOCK_CONFLICT_MESSAGE);
	});
});
