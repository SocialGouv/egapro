import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mutateMock, invalidateOverviewMock, mutationState } = vi.hoisted(() => {
	return {
		mutateMock: vi.fn(),
		invalidateOverviewMock: vi.fn().mockResolvedValue(undefined),
		mutationState: { isPending: false } as {
			isPending: boolean;
			onSuccess?: () => Promise<void> | void;
			onError?: (err: { message: string }) => void;
		},
	};
});

vi.mock("~/trpc/react", () => ({
	api: {
		adminSettings: {
			setActiveCampaignYear: {
				useMutation: (opts: {
					onSuccess?: () => Promise<void> | void;
					onError?: (err: { message: string }) => void;
				}) => {
					mutationState.onSuccess = opts.onSuccess;
					mutationState.onError = opts.onError;
					return { mutate: mutateMock, isPending: mutationState.isPending };
				},
			},
			getOverview: { invalidate: invalidateOverviewMock },
		},
		useUtils: () => ({
			adminSettings: { getOverview: { invalidate: invalidateOverviewMock } },
		}),
	},
}));

import { ActiveYearForm } from "../ActiveYearForm";

describe("ActiveYearForm", () => {
	beforeEach(() => {
		mutateMock.mockReset();
		invalidateOverviewMock.mockClear();
		mutationState.isPending = false;
	});

	it("renders the input prefilled with the initial active year", () => {
		render(<ActiveYearForm fallbackYear={2026} initialActiveYear={2025} />);
		expect(screen.getByLabelText(/année de référence active/i)).toHaveValue(
			2025,
		);
	});

	it("falls back to the calendar year when no active year is configured", () => {
		render(<ActiveYearForm fallbackYear={2028} initialActiveYear={null} />);
		expect(screen.getByLabelText(/année de référence active/i)).toHaveValue(
			2028,
		);
	});

	it("rejects invalid years with a Zod error", async () => {
		render(<ActiveYearForm fallbackYear={2026} initialActiveYear={2026} />);
		const input = screen.getByLabelText(/année de référence active/i);
		await userEvent.clear(input);
		await userEvent.type(input, "1999");
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => {
			expect(screen.getByText(/année minimale/i)).toBeInTheDocument();
		});
		expect(mutateMock).not.toHaveBeenCalled();
	});

	it("submits valid input to the mutation", async () => {
		render(<ActiveYearForm fallbackYear={2026} initialActiveYear={2026} />);
		const input = screen.getByLabelText(/année de référence active/i);
		await userEvent.clear(input);
		await userEvent.type(input, "2027");
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => {
			expect(mutateMock).toHaveBeenCalledWith({ activeCampaignYear: 2027 });
		});
	});

	it("shows a success alert and invalidates overview on success", async () => {
		render(<ActiveYearForm fallbackYear={2026} initialActiveYear={2026} />);
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(mutateMock).toHaveBeenCalled());
		await mutationState.onSuccess?.();
		await waitFor(() => {
			expect(
				screen.getByText(/année de référence enregistrée/i),
			).toBeInTheDocument();
		});
		expect(invalidateOverviewMock).toHaveBeenCalled();
	});

	it("shows the server error when the mutation fails", async () => {
		render(<ActiveYearForm fallbackYear={2026} initialActiveYear={2026} />);
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(mutateMock).toHaveBeenCalled());
		mutationState.onError?.({ message: "Unauthorized" });
		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent("Unauthorized");
		});
	});
});
