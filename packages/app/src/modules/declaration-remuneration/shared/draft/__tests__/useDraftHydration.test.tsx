import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDraftHydration } from "../useDraftHydration";

describe("useDraftHydration", () => {
	it("does not call applyDraft while loading", () => {
		const applyDraft = vi.fn();
		const { result } = renderHook(() =>
			useDraftHydration(true, { foo: "bar" }, applyDraft),
		);
		expect(result.current).toBe(false);
		expect(applyDraft).not.toHaveBeenCalled();
	});

	it("calls applyDraft once when loading completes and returns true", () => {
		const applyDraft = vi.fn();
		const { result, rerender } = renderHook(
			({ isLoading }) =>
				useDraftHydration(isLoading, { foo: "bar" }, applyDraft),
			{ initialProps: { isLoading: true } },
		);
		expect(result.current).toBe(false);

		rerender({ isLoading: false });
		expect(applyDraft).toHaveBeenCalledTimes(1);
		expect(applyDraft).toHaveBeenCalledWith({ foo: "bar" });
		expect(result.current).toBe(true);
	});

	it("does not re-apply draft when draft changes after hydration", () => {
		const applyDraft = vi.fn();
		const { rerender } = renderHook(
			({ draft }) => useDraftHydration(false, draft, applyDraft),
			{ initialProps: { draft: { foo: "a" } } },
		);
		expect(applyDraft).toHaveBeenCalledTimes(1);

		rerender({ draft: { foo: "b" } });
		expect(applyDraft).toHaveBeenCalledTimes(1);
	});

	it("uses the latest applyDraft callback identity without re-firing", () => {
		const first = vi.fn();
		const second = vi.fn();
		const { rerender } = renderHook(
			({ apply }) => useDraftHydration(false, { foo: "x" }, apply),
			{ initialProps: { apply: first } },
		);
		expect(first).toHaveBeenCalledTimes(1);

		act(() => {
			rerender({ apply: second });
		});
		expect(second).not.toHaveBeenCalled();
	});
});
