import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mutateAsync, mutationState } = vi.hoisted(() => ({
	mutateAsync: vi.fn(),
	mutationState: {
		isPending: false,
		error: null as null | { data?: { code?: string } },
	},
}));

vi.mock("~/trpc/react", () => ({
	api: {
		representationDeclaration: {
			saveDraft: {
				useMutation: () => ({
					mutateAsync,
					isPending: mutationState.isPending,
					error: mutationState.error,
				}),
			},
		},
	},
}));

import type { RepresentationDraft } from "~/modules/declaration-representation/types";
import { useRepresentationDraft } from "../useRepresentationDraft";

const YEAR = 2025;
const DEBOUNCE_MS = 600;
const VISUAL_DELAY_MS = 400;

function renderDraft({
	step = 2,
	initialDraft = { currentStep: 2 } as RepresentationDraft,
	enabled = true,
} = {}) {
	return renderHook(
		(props: { initialDraft: RepresentationDraft; enabled: boolean }) =>
			useRepresentationDraft({ year: YEAR, step, ...props }),
		{ initialProps: { initialDraft, enabled } },
	);
}

beforeEach(() => {
	vi.useFakeTimers();
	mutateAsync.mockReset().mockResolvedValue(undefined);
	mutationState.isPending = false;
	mutationState.error = null;
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

		expect(mutateAsync).not.toHaveBeenCalled();

		act(() => vi.advanceTimersByTime(1));

		expect(mutateAsync).toHaveBeenCalledTimes(1);
		expect(mutateAsync).toHaveBeenCalledWith({
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

		expect(mutateAsync).toHaveBeenCalledTimes(1);
		expect(mutateAsync).toHaveBeenCalledWith(
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

		expect(mutateAsync).toHaveBeenCalledTimes(1);
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

		expect(mutateAsync).not.toHaveBeenCalled();
		expect(result.current.isPendingSave).toBe(false);
		expect(result.current.draft.executiveWomenPercent).toBe(60);

		act(() => unmount());
		expect(mutateAsync).not.toHaveBeenCalled();
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

		expect(mutateAsync).toHaveBeenCalledTimes(1);
		expect(result.current.isPendingSave).toBe(false);
	});

	it("propagates a failed save to the caller", async () => {
		mutateAsync.mockRejectedValueOnce(new Error("network"));
		const { result } = renderDraft();

		await expect(result.current.saveProgress(3)).rejects.toThrow("network");
	});
});

describe("useRepresentationDraft — pending save handed to the lock", () => {
	it("sends the pending input at once and resolves once the save settles", async () => {
		let settle: () => void = () => undefined;
		mutateAsync.mockReturnValueOnce(
			new Promise<void>((resolve) => {
				settle = resolve;
			}),
		);
		const { result } = renderDraft();
		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));

		let settled = false;
		act(() => {
			void result.current.flushPendingSave().then(() => {
				settled = true;
			});
		});

		expect(mutateAsync).toHaveBeenCalledWith(
			expect.objectContaining({
				draft: { currentStep: 2, executiveWomenPercent: 60 },
			}),
		);
		await act(async () => {
			await Promise.resolve();
		});
		expect(settled).toBe(false);

		await act(async () => {
			settle();
			await Promise.resolve();
		});
		expect(settled).toBe(true);

		act(() => vi.advanceTimersByTime(DEBOUNCE_MS));
		expect(mutateAsync).toHaveBeenCalledTimes(1);
	});

	it("resolves without throwing when the pending save is rejected", async () => {
		mutateAsync.mockRejectedValueOnce(new Error("conflict"));
		const { result } = renderDraft();
		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));

		await expect(result.current.flushPendingSave()).resolves.toBeUndefined();
	});

	it("has nothing to send when no input is pending", async () => {
		const { result } = renderDraft();

		await result.current.flushPendingSave();

		expect(mutateAsync).not.toHaveBeenCalled();
	});
});

describe("useRepresentationDraft — reloaded draft", () => {
	it("keeps the draft version stable on mount", () => {
		const { result } = renderDraft();

		expect(result.current.draftVersion).toBe(0);
	});

	it("replaces the draft, drops the pending input and bumps the version when the server draft changes", () => {
		const { result, rerender } = renderDraft({
			initialDraft: { currentStep: 2, executiveWomenPercent: 10 },
		});
		act(() => result.current.setDraftValues({ executiveWomenPercent: 60 }));

		rerender({
			initialDraft: { currentStep: 3, executiveWomenPercent: 70 },
			enabled: true,
		});
		act(() => vi.advanceTimersByTime(DEBOUNCE_MS));

		expect(result.current.draft).toEqual({
			currentStep: 3,
			executiveWomenPercent: 70,
		});
		expect(result.current.draftVersion).toBe(1);
		expect(mutateAsync).not.toHaveBeenCalled();
	});
});

describe("useRepresentationDraft — save errors", () => {
	it("explains that the input was not saved when the lock was lost", () => {
		mutationState.error = { data: { code: "CONFLICT" } };
		const { result } = renderDraft();

		expect(result.current.saveError).toBe(
			"Le verrou a été perdu avant l’enregistrement : votre dernière saisie n’a pas été enregistrée.",
		);
	});

	it("invites to retry after any other failure", () => {
		mutationState.error = { data: { code: "INTERNAL_SERVER_ERROR" } };
		const { result } = renderDraft();

		expect(result.current.saveError).toBe(
			"L’enregistrement de votre saisie a échoué. Veuillez réessayer.",
		);
	});
});
