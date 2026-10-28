import { useSyncExternalStore } from "react";
import { vi } from "vitest";

export const PAGE_PATH = "/declaration-remuneration/parcours-conformite";

let search = "";
const listeners = new Set<() => void>();

export const location = {
	getSearch: () => search,
	setSearch: (next: string) => {
		search = next;
		for (const listener of listeners) listener();
	},
	subscribe: (listener: () => void) => {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
};

export const draftRef = { current: {} as Record<string, unknown> };
export const mutationErrorRef = {
	current: null as { message: string } | null,
};

export const mockSetField = vi.fn();
export const mockMutate = vi.fn();
export const mockPush = vi.fn((href: string) => {
	if (href.startsWith(PAGE_PATH)) {
		location.setSearch(href.split("?")[1] ?? "");
	}
});
export const mockReplace = vi.fn((href: string) => {
	location.setSearch(href.split("?")[1] ?? "");
});
export const mockBack = vi.fn(() => location.setSearch(""));

export const useRouter = () => ({
	push: mockPush,
	replace: mockReplace,
	back: mockBack,
});

export const useSearchParams = () =>
	new URLSearchParams(
		useSyncExternalStore(location.subscribe, location.getSearch),
	);

export const useDeclarationDraft = () => ({
	draft: draftRef.current,
	setField: mockSetField,
	clearDraft: vi.fn(),
	hasDraft: false,
	isLoadingDraft: false,
	isSaving: false,
	isPendingSave: false,
});

export const api = {
	declaration: {
		saveCompliancePath: {
			useMutation: (opts: {
				onSuccess?: (data: unknown, variables: { path: string }) => void;
			}) => ({
				mutate: (args: { path: string }) => {
					mockMutate(args);
					opts.onSuccess?.(undefined, args);
				},
				isPending: false,
				error: mutationErrorRef.current,
			}),
		},
	},
	mail: {
		resendReceipt: {
			useMutation: () => ({ mutate: vi.fn(), isPending: false }),
		},
	},
};

export function resetCompliancePathChoiceMocks() {
	mockMutate.mockClear();
	mockPush.mockClear();
	mockReplace.mockClear();
	mockBack.mockClear();
	mockSetField.mockClear();
	location.setSearch("");
	draftRef.current = {};
	mutationErrorRef.current = null;
}
