import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mutate, mutateAsync, mutationState } = vi.hoisted(() => ({
	mutate: vi.fn(),
	mutateAsync: vi.fn(),
	mutationState: { isPending: false },
}));

vi.mock("~/trpc/react", () => ({
	api: {
		representationDeclaration: {
			saveDraft: {
				useMutation: () => ({
					mutate,
					mutateAsync,
					isPending: mutationState.isPending,
				}),
			},
		},
	},
}));

import type { RepresentationDraft } from "../../../types";
import { useRepresentationDraft } from "../useRepresentationDraft";

const YEAR = 2025;
const DEBOUNCE_MS = 600;
const VISUAL_DELAY_MS = 400;

function renderDraft({
	step = 2,
	initialDraft = { currentStep: 2 } as RepresentationDraft,
	enabled = true,
} = {}) {
	return renderHook(() =>
		useRepresentationDraft({ year: YEAR, step, initialDraft, enabled }),
	);
}

beforeEach(() => {
	vi.useFakeTimers();
	mutate.mockReset();
	mutateAsync.mockReset().mockResolvedValue(undefined);
	mutationState.isPending = false;
});

afterEach(() => {
	vi.useRealTimers();
});

describe("useRepresentationDraft — autosave", () => {
	it("groups successive edits into a single debounced save", () => {
		const { result } = renderDraft();

		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));
		act(() => result.current.setDraftValues({ executiveMenPercent: 40 }));
		act(() => vi.advanceTimersByTime(DEBOUNCE_MS - 1));

		expect(mutate).not.toHaveBeenCalled();

		act(() => vi.advanceTimersByTime(1));

		expect(mutate).toHaveBeenCalledTimes(1);
		expect(mutate).toHaveBeenCalledWith({
			year: YEAR,
			currentStep: 2,
			draft: {
				currentStep: 2,
				executiveWomenPercent: 60,
				executiveMenPercent: 40,
			},
		});
	});

	it("flags a pending save after the visual delay and clears it once flushed", () => {
		const { result } = renderDraft();

		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));
		expect(result.current.isPendingSave).toBe(false);

		act(() => vi.advanceTimersByTime(VISUAL_DELAY_MS));
		expect(result.current.isPendingSave).toBe(true);

		act(() => vi.advanceTimersByTime(DEBOUNCE_MS - VISUAL_DELAY_MS));
		expect(result.current.isPendingSave).toBe(false);
	});

	it("advances the stored progress to the step being filled", () => {
		const { result } = renderDraft({
			step: 3,
			initialDraft: { currentStep: 1 },
		});

		act(() => result.current.setDraftValues({ hasManagementBody: true }));

		expect(result.current.draft.currentStep).toBe(3);
	});

	it("never rewinds the stored progress when an earlier step is edited", () => {
		const { result } = renderDraft({
			step: 2,
			initialDraft: { currentStep: 4 },
		});

		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));

		expect(result.current.draft.currentStep).toBe(4);
	});

	it("saves the pending draft when the step unmounts before the debounce fires", () => {
		const { result, unmount } = renderDraft();

		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));
		act(() => unmount());

		expect(mutate).toHaveBeenCalledTimes(1);
		expect(mutate).toHaveBeenCalledWith(
			expect.objectContaining({
				draft: { currentStep: 2, executiveWomenPercent: 60 },
			}),
		);
	});

	it("does not save twice when the debounce already flushed before unmount", () => {
		const { result, unmount } = renderDraft();

		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));
		act(() => vi.advanceTimersByTime(DEBOUNCE_MS));
		act(() => unmount());

		expect(mutate).toHaveBeenCalledTimes(1);
	});

	it("exposes the mutation pending state as isSaving", () => {
		mutationState.isPending = true;
		const { result } = renderDraft();

		expect(result.current.isSaving).toBe(true);
	});
});

describe("useRepresentationDraft — closed campaign (S23)", () => {
	it("never fires a mutation when autosave is disabled", () => {
		const { result, unmount } = renderDraft({ enabled: false });

		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));
		act(() => vi.advanceTimersByTime(DEBOUNCE_MS));

		expect(mutate).not.toHaveBeenCalled();
		expect(result.current.isPendingSave).toBe(false);
		expect(result.current.draft.executiveWomenPercent).toBe(60);

		act(() => unmount());
		expect(mutate).not.toHaveBeenCalled();
	});

	it("does not persist progress when autosave is disabled", async () => {
		const { result } = renderDraft({ enabled: false });

		await act(async () => {
			await result.current.saveProgress(3);
		});

		expect(mutateAsync).not.toHaveBeenCalled();
		expect(result.current.draft.currentStep).toBe(3);
	});
});

describe("useRepresentationDraft — saveProgress", () => {
	it("persists the draft with the requested step", async () => {
		const { result } = renderDraft();

		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));
		await act(async () => {
			await result.current.saveProgress(3);
		});

		expect(mutateAsync).toHaveBeenCalledWith({
			year: YEAR,
			currentStep: 3,
			draft: { currentStep: 3, executiveWomenPercent: 60 },
		});
		expect(result.current.draft.currentStep).toBe(3);
	});

	it("cancels the pending debounced save it supersedes", async () => {
		const { result } = renderDraft();

		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));
		await act(async () => {
			await result.current.saveProgress(3);
		});
		act(() => vi.advanceTimersByTime(DEBOUNCE_MS));

		expect(mutate).not.toHaveBeenCalled();
		expect(result.current.isPendingSave).toBe(false);
	});

	it("propagates a failed save to the caller", async () => {
		mutateAsync.mockRejectedValueOnce(new Error("network"));
		const { result } = renderDraft();

		await expect(result.current.saveProgress(3)).rejects.toThrow("network");
	});
});
