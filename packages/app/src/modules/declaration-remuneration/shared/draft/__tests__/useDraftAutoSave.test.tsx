import { renderHook } from "@testing-library/react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { useDraftAutoSave } from "../useDraftAutoSave";

type TestValues = { name: string };

function makeForm(): {
	form: UseFormReturn<TestValues>;
	emit: (values: TestValues) => void;
	unsubscribe: ReturnType<typeof vi.fn>;
} {
	let watcher: ((values: TestValues) => void) | null = null;
	const unsubscribe = vi.fn();
	const watch = vi.fn((cb: (values: TestValues) => void) => {
		watcher = cb;
		return { unsubscribe };
	});
	return {
		form: { watch } as unknown as UseFormReturn<TestValues>,
		emit: (values) => watcher?.(values),
		unsubscribe,
	};
}

describe("useDraftAutoSave", () => {
	it("does not subscribe while not ready", () => {
		const { form } = makeForm();
		const onChange = vi.fn();
		renderHook(() => useDraftAutoSave(form, false, onChange));
		expect((form.watch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
	});

	it("subscribes and propagates values when ready", () => {
		const { form, emit } = makeForm();
		const onChange = vi.fn();
		renderHook(() => useDraftAutoSave(form, true, onChange));
		emit({ name: "alice" });
		expect(onChange).toHaveBeenCalledWith({ name: "alice" });
	});

	it("unsubscribes on unmount", () => {
		const { form, unsubscribe } = makeForm();
		const { unmount } = renderHook(() => useDraftAutoSave(form, true, vi.fn()));
		unmount();
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it("uses the latest onChange callback identity without re-subscribing", () => {
		const { form, emit } = makeForm();
		const first = vi.fn();
		const second = vi.fn();
		const { rerender } = renderHook(
			({ onChange }: { onChange: (values: FieldValues) => void }) =>
				useDraftAutoSave(form, true, onChange),
			{ initialProps: { onChange: first } },
		);
		expect((form.watch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);

		rerender({ onChange: second });
		expect((form.watch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);

		emit({ name: "bob" });
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledWith({ name: "bob" });
	});
});
