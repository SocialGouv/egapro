import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async () => {
	const actual =
		await vi.importActual<typeof import("next/navigation")>("next/navigation");
	return {
		...actual,
		useRouter: () => ({
			push: vi.fn(),
			replace: vi.fn(),
			back: vi.fn(),
			refresh: vi.fn(),
		}),
		useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
	};
});

vi.mock("~/trpc/react", () => ({
	api: {
		adminReferents: {
			search: {
				useQuery: vi.fn().mockReturnValue({
					data: {
						rows: [
							{
								id: "ref-1",
								region: "11",
								county: "75",
								name: "Jean DUPONT",
								type: "email",
								value: "jean@gouv.fr",
								principal: true,
								substituteName: "Marie MARTIN",
								substituteEmail: "marie@gouv.fr",
								createdAt: new Date("2024-06-15T10:00:00Z"),
							},
						],
						total: 1,
						page: 1,
						pageSize: 20,
						totalPages: 1,
					},
					isLoading: false,
					refetch: vi.fn(),
				}),
			},
			delete: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					isPending: false,
				}),
			},
			create: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					isPending: false,
				}),
			},
			update: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					isPending: false,
				}),
			},
			import: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					isPending: false,
				}),
			},
			exportAll: {
				useQuery: vi.fn().mockReturnValue({
					data: null,
					refetch: vi.fn(),
					isFetching: false,
				}),
			},
		},
	},
}));

import { api } from "~/trpc/react";
import { AdminReferentsPage } from "../AdminReferentsPage";

describe("AdminReferentsPage", () => {
	it("renders page title", () => {
		render(<AdminReferentsPage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Liste des référents Egapro",
			}),
		).toBeInTheDocument();
	});

	it("renders search form", () => {
		render(<AdminReferentsPage />);
		expect(
			screen.getByRole("button", { name: "Rechercher" }),
		).toBeInTheDocument();
	});

	it("renders table with data", () => {
		render(<AdminReferentsPage />);
		expect(screen.getByText("Jean DUPONT")).toBeInTheDocument();
		expect(screen.getByText("jean@gouv.fr")).toBeInTheDocument();
	});

	it("shows result count", () => {
		render(<AdminReferentsPage />);
		expect(screen.getByText("1 résultat")).toBeInTheDocument();
	});

	it("renders action buttons", () => {
		render(<AdminReferentsPage />);
		expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Importer" }),
		).toBeInTheDocument();
	});

	it("neutralises spreadsheet formulas in the CSV export", async () => {
		vi.mocked(api.adminReferents.exportAll.useQuery).mockReturnValue({
			data: [
				{
					region: "11",
					county: "75",
					name: "=1+1",
					type: "email",
					value: "email@example.fr",
					principal: true,
					substituteName: '@SUM("A1")',
					substituteEmail: null,
				},
			],
			refetch: vi.fn(),
			isFetching: false,
		} as never);
		vi.mocked(URL.createObjectURL).mockClear();

		render(<AdminReferentsPage />);
		fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));

		await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledOnce());
		const blob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0] as Blob;
		const [header, dataLine] = (await blob.text()).split("\n");
		expect(header).toBe(
			"region;county;name;type;value;principal;substituteName;substituteEmail",
		);
		expect(dataLine).toBe(
			`"11";"75";"'=1+1";"email";"email@example.fr";"true";"'@SUM(""A1"")";""`,
		);
	});
});
