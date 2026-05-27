import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "../useDebouncedValue";

describe("useDebouncedValue", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the initial value synchronously on first render", () => {
		const { result } = renderHook(() => useDebouncedValue(30, 500));
		expect(result.current).toBe(30);
	});

	it("keeps the previous value until the delay has elapsed", () => {
		const { result, rerender } = renderHook(
			({ value }: { value: number }) => useDebouncedValue(value, 500),
			{ initialProps: { value: 30 } },
		);

		rerender({ value: 60 });
		expect(result.current).toBe(30);

		act(() => {
			vi.advanceTimersByTime(499);
		});
		expect(result.current).toBe(30);

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current).toBe(60);
	});

	it("resets the timer when the value changes again before the delay", () => {
		const { result, rerender } = renderHook(
			({ value }: { value: number }) => useDebouncedValue(value, 500),
			{ initialProps: { value: 30 } },
		);

		rerender({ value: 60 });
		act(() => {
			vi.advanceTimersByTime(400);
		});
		rerender({ value: 90 });
		act(() => {
			vi.advanceTimersByTime(400);
		});
		expect(result.current).toBe(30);

		act(() => {
			vi.advanceTimersByTime(100);
		});
		expect(result.current).toBe(90);
	});
});
