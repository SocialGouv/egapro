import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { lockMutate, lockState, invalidateLockTimeout } = vi.hoisted(() => ({
	lockMutate: vi.fn(),
	lockState: { isPending: false } as {
		isPending: boolean;
		onSuccess?: () => Promise<void> | void;
		onError?: (err: { message: string }) => void;
	},
	invalidateLockTimeout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		adminSettings: {
			updateLockTimeout: {
				useMutation: (opts: {
					onSuccess?: () => Promise<void> | void;
					onError?: (err: { message: string }) => void;
				}) => {
					lockState.onSuccess = opts.onSuccess;
					lockState.onError = opts.onError;
					return { mutate: lockMutate, isPending: lockState.isPending };
				},
			},
		},
		useUtils: () => ({
			adminSettings: {
				getLockTimeout: { invalidate: invalidateLockTimeout },
			},
		}),
	},
}));

import { LockTimeoutForm } from "../LockTimeoutForm";

describe("LockTimeoutForm", () => {
	beforeEach(() => {
		lockMutate.mockReset();
		invalidateLockTimeout.mockClear();
		lockState.isPending = false;
	});

	it("seeds the input with the initial timeout", () => {
		render(<LockTimeoutForm initialTimeoutMinutes={30} />);
		expect(screen.getByLabelText(/délai d'expiration du verrou/i)).toHaveValue(
			30,
		);
	});

	it("submits the entered timeout", async () => {
		render(<LockTimeoutForm initialTimeoutMinutes={30} />);
		const input = screen.getByLabelText(/délai d'expiration du verrou/i);
		await userEvent.clear(input);
		await userEvent.type(input, "60");
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(lockMutate).toHaveBeenCalled());
		expect(lockMutate.mock.calls[0]?.[0]).toEqual({ timeoutMinutes: 60 });
	});

	it("blocks submission and shows an error for an out-of-range value", async () => {
		render(<LockTimeoutForm initialTimeoutMinutes={30} />);
		const input = screen.getByLabelText(/délai d'expiration du verrou/i);
		await userEvent.clear(input);
		await userEvent.type(input, "1441");
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() =>
			expect(
				screen.getByLabelText(/délai d'expiration du verrou/i),
			).toHaveAttribute("aria-invalid", "true"),
		);
		expect(
			document.getElementById("lock-timeout-minutes-error"),
		).toBeInTheDocument();
		expect(lockMutate).not.toHaveBeenCalled();
	});

	it("shows a success alert and invalidates the query on success", async () => {
		render(<LockTimeoutForm initialTimeoutMinutes={30} />);
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(lockMutate).toHaveBeenCalled());
		await lockState.onSuccess?.();
		await waitFor(() =>
			expect(
				screen.getByText(/délai d'expiration enregistré/i),
			).toBeInTheDocument(),
		);
		expect(invalidateLockTimeout).toHaveBeenCalled();
	});

	it("surfaces the server error when the mutation fails", async () => {
		render(<LockTimeoutForm initialTimeoutMinutes={30} />);
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(lockMutate).toHaveBeenCalled());
		lockState.onError?.({ message: "Réservé aux administrateurs" });
		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Réservé aux administrateurs",
			),
		);
		expect(invalidateLockTimeout).not.toHaveBeenCalled();
	});

	it("disables the submit button while the mutation is pending", () => {
		lockState.isPending = true;
		render(<LockTimeoutForm initialTimeoutMinutes={30} />);
		expect(
			screen.getByRole("button", { name: /enregistrement/i }),
		).toBeDisabled();
	});
});
