import { afterEach, describe, expect, it, vi } from "vitest";
import { getDsfrModal } from "../getDsfrModal";

describe("getDsfrModal", () => {
	afterEach(() => {
		// Clean up window.dsfr after each test
		Reflect.deleteProperty(window, "dsfr");
	});

	it("returns null when window.dsfr is not defined", () => {
		const element = document.createElement("div");
		expect(getDsfrModal(element)).toBeNull();
	});

	it("returns the modal API when window.dsfr is defined", () => {
		const mockModal = { disclose: vi.fn(), conceal: vi.fn() };
		const mockDsfr = vi.fn().mockReturnValue({ modal: mockModal });
		Object.defineProperty(window, "dsfr", {
			value: mockDsfr,
			configurable: true,
		});

		const element = document.createElement("div");
		const result = getDsfrModal(element);

		expect(mockDsfr).toHaveBeenCalledWith(element);
		expect(result).toBe(mockModal);
	});

	it("calls the correct DSFR element", () => {
		const mockModal = { disclose: vi.fn(), conceal: vi.fn() };
		const mockDsfr = vi.fn().mockReturnValue({ modal: mockModal });
		Object.defineProperty(window, "dsfr", {
			value: mockDsfr,
			configurable: true,
		});

		const element = document.createElement("dialog");
		getDsfrModal(element);

		expect(mockDsfr).toHaveBeenCalledWith(element);
	});
});
