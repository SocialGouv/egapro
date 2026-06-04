import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { mockUseQuery } = vi.hoisted(() => ({ mockUseQuery: vi.fn() }));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			getStatusHistory: {
				useQuery: mockUseQuery,
			},
		},
	},
}));

import { HistoryListSection } from "../HistoryListSection";

const makeItem = (id: string) => ({
	id,
	eventType: "submit" as const,
	value: null,
	round: null,
	createdAt: new Date("2026-09-28T13:10:00Z"),
	actor: {
		firstName: "Maria",
		lastName: "Dupont",
		email: "maria.dupont@example.fr",
	},
});

describe("HistoryListSection", () => {
	it("shows empty state when no items and not fetching", async () => {
		mockUseQuery.mockReturnValue({
			data: { items: [], total: 0 },
			isFetching: false,
		});

		render(<HistoryListSection siren="130025265" year={2026} />);

		await waitFor(() => {
			expect(
				screen.getByText("Aucune action enregistrée pour cette démarche."),
			).toBeInTheDocument();
		});
	});

	it("renders history items when data is loaded", async () => {
		const items = [makeItem("item-1"), makeItem("item-2")];
		mockUseQuery.mockReturnValue({
			data: { items, total: 2 },
			isFetching: false,
		});

		render(<HistoryListSection siren="130025265" year={2026} />);

		await waitFor(() => {
			expect(screen.getAllByText("Maria Dupont")).toHaveLength(2);
		});
	});

	it("does not show Voir plus when all items are loaded", async () => {
		mockUseQuery.mockReturnValue({
			data: { items: [makeItem("item-1")], total: 1 },
			isFetching: false,
		});

		render(<HistoryListSection siren="130025265" year={2026} />);

		await waitFor(() => {
			expect(
				screen.queryByRole("button", { name: "Voir plus" }),
			).not.toBeInTheDocument();
		});
	});

	it("shows Voir plus button when more items exist", async () => {
		const items = Array.from({ length: 10 }, (_, i) => makeItem(`item-${i}`));
		mockUseQuery.mockReturnValue({
			data: { items, total: 15 },
			isFetching: false,
		});

		render(<HistoryListSection siren="130025265" year={2026} />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "Voir plus" }),
			).toBeInTheDocument();
		});
	});

	it("loads more items when Voir plus is clicked", async () => {
		const firstPage = Array.from({ length: 10 }, (_, i) =>
			makeItem(`item-${i}`),
		);
		const secondPage = Array.from({ length: 3 }, (_, i) =>
			makeItem(`more-${i}`),
		);

		mockUseQuery
			.mockReturnValueOnce({
				data: { items: firstPage, total: 13 },
				isFetching: false,
			})
			.mockReturnValue({
				data: { items: secondPage, total: 13 },
				isFetching: false,
			});

		render(<HistoryListSection siren="130025265" year={2026} />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "Voir plus" }),
			).toBeInTheDocument();
		});

		await userEvent.click(screen.getByRole("button", { name: "Voir plus" }));

		await waitFor(() => {
			expect(
				screen.queryByRole("button", { name: "Voir plus" }),
			).not.toBeInTheDocument();
		});
	});
});
