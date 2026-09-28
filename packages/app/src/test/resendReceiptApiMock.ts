import { vi } from "vitest";

// Shared by the end-of-démarche screens: one spy, so the payload is assertable.
export const resendReceiptMutate = vi.fn();

export const api = {
	mail: {
		resendReceipt: {
			useMutation: () => ({ isPending: false, mutate: resendReceiptMutate }),
		},
	},
};
