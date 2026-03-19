import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { useZodForm } from "../useZodForm";

const testSchema = z.object({
	name: z.string().min(1),
	age: z.number().int().min(0),
});

describe("useZodForm", () => {
	it("returns a form with default values", () => {
		const { result } = renderHook(() =>
			useZodForm(testSchema, {
				defaultValues: { name: "Alice", age: 30 },
			}),
		);

		expect(result.current.getValues()).toEqual({ name: "Alice", age: 30 });
	});

	it("rejects invalid data via trigger", async () => {
		const { result } = renderHook(() =>
			useZodForm(testSchema, {
				defaultValues: { name: "", age: -1 },
			}),
		);

		let isValid = true;
		await act(async () => {
			isValid = await result.current.trigger();
		});

		expect(isValid).toBe(false);
	});

	it("accepts valid data via trigger", async () => {
		const { result } = renderHook(() =>
			useZodForm(testSchema, {
				defaultValues: { name: "Bob", age: 25 },
			}),
		);

		let isValid = false;
		await act(async () => {
			isValid = await result.current.trigger();
		});

		expect(isValid).toBe(true);
	});
});
