import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	consumeDeclarationTransmissionSuccess,
	consumeJointEvaluationTransmissionSuccess,
	markDeclarationTransmissionSuccess,
	markJointEvaluationTransmissionSuccess,
} from "../declarationSuccessFlash";

// `vi.spyOn` can't override the native Storage methods in jsdom; replacing
// `window.sessionStorage` itself is the only way to simulate it throwing
// (private browsing, quota exceeded).
function withThrowingSessionStorage(run: () => void) {
	const real = window.sessionStorage;
	Object.defineProperty(window, "sessionStorage", {
		configurable: true,
		value: {
			getItem: () => {
				throw new Error("sessionStorage disabled");
			},
			setItem: () => {
				throw new Error("sessionStorage disabled");
			},
		},
	});
	try {
		run();
	} finally {
		Object.defineProperty(window, "sessionStorage", {
			configurable: true,
			value: real,
		});
	}
}

describe("declarationSuccessFlash", () => {
	beforeEach(() => {
		window.sessionStorage.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("declaration transmission signal", () => {
		it("is consumed as fresh right after being marked", () => {
			markDeclarationTransmissionSuccess();
			expect(consumeDeclarationTransmissionSuccess()).toBe(true);
		});

		it("is absent when nothing was marked", () => {
			expect(consumeDeclarationTransmissionSuccess()).toBe(false);
		});

		it("is consumed only once: a second read finds nothing", () => {
			markDeclarationTransmissionSuccess();
			consumeDeclarationTransmissionSuccess();
			expect(consumeDeclarationTransmissionSuccess()).toBe(false);
		});

		it("expires past the 30s validity window", () => {
			vi.useFakeTimers();
			markDeclarationTransmissionSuccess();
			vi.advanceTimersByTime(30_001);
			expect(consumeDeclarationTransmissionSuccess()).toBe(false);
		});

		it("does not throw when sessionStorage is unavailable", () => {
			withThrowingSessionStorage(() => {
				expect(() => consumeDeclarationTransmissionSuccess()).not.toThrow();
				expect(consumeDeclarationTransmissionSuccess()).toBe(false);
			});
		});

		it("does not throw when marking fails", () => {
			withThrowingSessionStorage(() => {
				expect(() => markDeclarationTransmissionSuccess()).not.toThrow();
			});
		});
	});

	describe("joint evaluation transmission signal", () => {
		it("is consumed as fresh right after being marked, independently of the declaration signal", () => {
			markJointEvaluationTransmissionSuccess();
			expect(consumeDeclarationTransmissionSuccess()).toBe(false);
			expect(consumeJointEvaluationTransmissionSuccess()).toBe(true);
		});

		it("is consumed only once: a second read finds nothing", () => {
			markJointEvaluationTransmissionSuccess();
			consumeJointEvaluationTransmissionSuccess();
			expect(consumeJointEvaluationTransmissionSuccess()).toBe(false);
		});

		it("expires past the 30s validity window", () => {
			vi.useFakeTimers();
			markJointEvaluationTransmissionSuccess();
			vi.advanceTimersByTime(30_001);
			expect(consumeJointEvaluationTransmissionSuccess()).toBe(false);
		});
	});
});
