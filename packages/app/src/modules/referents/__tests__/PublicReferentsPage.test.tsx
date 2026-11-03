import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useSearchParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", async () => {
	const actual =
		await vi.importActual<typeof import("next/navigation")>("next/navigation");
	return {
		...actual,
		useRouter: () => ({ push: mockPush }),
		useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
		usePathname: () => "/referents",
	};
});

const useQueryMock = vi.fn();
vi.mock("~/trpc/react", () => ({
	api: {
		publicReferents: {
			search: {
				useQuery: (...args: unknown[]) => useQueryMock(...args),
			},
		},
	},
}));

import { PublicReferentsPage } from "../PublicReferentsPage";

describe("PublicReferentsPage", () => {
	it("renders title and intro paragraph", () => {
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: false,
		});
		render(<PublicReferentsPage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /référents égalité professionnelle/i,
			}),
		).toBeInTheDocument();
		expect(screen.getByText(/trouvez le référent/i)).toBeInTheDocument();
	});

	it("renders the search form", () => {
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: false,
		});
		render(<PublicReferentsPage />);
		expect(
			screen.getByRole("button", { name: /^rechercher$/i }),
		).toBeInTheDocument();
	});

	it("does not call the search API when no filter is set", () => {
		useQueryMock.mockClear();
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: false,
		});
		render(<PublicReferentsPage />);
		expect(useQueryMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ enabled: false }),
		);
		expect(
			screen.getByText(/sélectionnez au moins un filtre/i),
		).toBeInTheDocument();
	});

	it("enables the search API when at least one filter is set", async () => {
		vi.mocked(useSearchParams).mockReturnValueOnce(
			new URLSearchParams({ region: "93" }) as ReturnType<
				typeof useSearchParams
			>,
		);
		useQueryMock.mockClear();
		useQueryMock.mockReturnValue({
			data: { rows: [], total: 0, page: 1, pageSize: 20, totalPages: 1 },
			isLoading: false,
			isError: false,
		});
		render(<PublicReferentsPage />);
		expect(useQueryMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ enabled: true }),
		);
	});

	it("shows empty state when filter yields no results", () => {
		vi.mocked(useSearchParams).mockReturnValueOnce(
			new URLSearchParams({ region: "93" }) as ReturnType<
				typeof useSearchParams
			>,
		);
		useQueryMock.mockReturnValue({
			data: { rows: [], total: 0, page: 1, pageSize: 20, totalPages: 1 },
			isLoading: false,
			isError: false,
		});
		render(<PublicReferentsPage />);
		expect(screen.getByText(/aucun référent/i)).toBeInTheDocument();
	});

	it("renders a list of referents when data is returned", () => {
		vi.mocked(useSearchParams).mockReturnValueOnce(
			new URLSearchParams({ region: "11" }) as ReturnType<
				typeof useSearchParams
			>,
		);
		useQueryMock.mockReturnValue({
			data: {
				rows: [
					{
						id: "r-1",
						region: "11",
						county: "75",
						name: "Marie Durand",
						principal: true,
					},
				],
				total: 1,
				page: 1,
				pageSize: 20,
				totalPages: 1,
			},
			isLoading: false,
			isError: false,
		});
		render(<PublicReferentsPage />);
		expect(screen.getByText("Marie Durand")).toBeInTheDocument();
		expect(screen.getByText(/1 référent trouvé/i)).toBeInTheDocument();
	});

	it("renders the error alert when the query fails", () => {
		vi.mocked(useSearchParams).mockReturnValueOnce(
			new URLSearchParams({ region: "11" }) as ReturnType<
				typeof useSearchParams
			>,
		);
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});
		render(<PublicReferentsPage />);
		expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
	});

	it("shows a loading state when data is not yet available", () => {
		vi.mocked(useSearchParams).mockReturnValueOnce(
			new URLSearchParams({ region: "11" }) as ReturnType<
				typeof useSearchParams
			>,
		);
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
		});
		render(<PublicReferentsPage />);
		expect(screen.getByText(/chargement des résultats/i)).toBeInTheDocument();
	});

	it("renders pagination when there is more than one page", () => {
		vi.mocked(useSearchParams).mockReturnValueOnce(
			new URLSearchParams({ region: "11" }) as ReturnType<
				typeof useSearchParams
			>,
		);
		useQueryMock.mockReturnValue({
			data: { rows: [], total: 50, page: 1, pageSize: 20, totalPages: 3 },
			isLoading: false,
			isError: false,
		});
		render(<PublicReferentsPage />);
		expect(
			screen.getByRole("navigation", { name: /pagination/i }),
		).toBeInTheDocument();
	});

	it("keeps keyboard focus on « Dernière page » once the last page is shown", async () => {
		const user = userEvent.setup();
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams({ region: "11" }) as ReturnType<
				typeof useSearchParams
			>,
		);
		const pageData = (page: number) => ({
			data: { rows: [], total: 50, page, pageSize: 20, totalPages: 3 },
			isLoading: false,
			isError: false,
		});
		useQueryMock.mockReturnValue(pageData(2));
		mockPush.mockClear();
		const { rerender } = render(<PublicReferentsPage />);
		const last = screen.getByRole("button", { name: "Dernière page" });
		last.focus();

		await user.keyboard("{Enter}");
		expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=3"));

		useQueryMock.mockReturnValue(pageData(3));
		rerender(<PublicReferentsPage />);
		expect(last).toHaveAttribute("aria-disabled", "true");
		expect(last).toBeEnabled();
		expect(last).toHaveFocus();

		mockPush.mockClear();
		await user.keyboard("{Enter}");
		expect(mockPush).not.toHaveBeenCalled();
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams() as ReturnType<typeof useSearchParams>,
		);
	});

	it("does not render pagination when there is only one page", () => {
		vi.mocked(useSearchParams).mockReturnValueOnce(
			new URLSearchParams({ region: "11" }) as ReturnType<
				typeof useSearchParams
			>,
		);
		useQueryMock.mockReturnValue({
			data: { rows: [], total: 5, page: 1, pageSize: 20, totalPages: 1 },
			isLoading: false,
			isError: false,
		});
		render(<PublicReferentsPage />);
		expect(
			screen.queryByRole("navigation", { name: /pagination/i }),
		).not.toBeInTheDocument();
	});
});
