import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async () => {
	const actual =
		await vi.importActual<typeof import("next/navigation")>("next/navigation");
	return {
		...actual,
		useRouter: vi.fn().mockReturnValue({
			push: vi.fn(),
			replace: vi.fn(),
			back: vi.fn(),
			refresh: vi.fn(),
		}),
		useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
	};
});

import { COMPANY_SIZE_RANGES, type CompanySizeRange } from "~/modules/domain";

import { SearchForm } from "../SearchForm";

function mockRouterPush() {
	const push = vi.fn();
	vi.mocked(useRouter).mockReturnValue({
		push,
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	} as unknown as ReturnType<typeof useRouter>);
	return push;
}

describe("SearchForm", () => {
	beforeEach(() => {
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams() as ReturnType<typeof useSearchParams>,
		);
	});

	it("renders all search fields and omits the removed Index / Valeur pair", () => {
		render(<SearchForm />);

		expect(screen.getByLabelText("SIREN / Nom entreprise")).toBeInTheDocument();
		expect(screen.getByLabelText("Email déclarant")).toBeInTheDocument();
		expect(screen.getByLabelText("Année")).toBeInTheDocument();
		expect(screen.getByLabelText("Date de dépôt (du)")).toBeInTheDocument();
		expect(screen.getByLabelText("Date de dépôt (au)")).toBeInTheDocument();
		expect(screen.getByLabelText("Statut")).toBeInTheDocument();
		expect(screen.getByLabelText("Effectif")).toBeInTheDocument();
		// Regression guard for #3274 — keep these negative assertions next to
		// their positive counterparts so a future reintroduction is caught here.
		expect(screen.queryByLabelText("Index")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Valeur")).not.toBeInTheDocument();
	});

	it("renders search and reset buttons", () => {
		render(<SearchForm />);

		expect(
			screen.getByRole("button", { name: "Rechercher" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Réinitialiser" }),
		).toBeInTheDocument();
	});

	it("pre-fills fields from search params", () => {
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams({ query: "ACME", year: "2024" }) as ReturnType<
				typeof useSearchParams
			>,
		);

		render(<SearchForm />);

		expect(screen.getByLabelText("SIREN / Nom entreprise")).toHaveValue("ACME");
		expect(screen.getByLabelText("Année")).toHaveValue(2024);
	});

	it("offers the domain size brackets plus the all-sizes option", () => {
		render(<SearchForm />);

		const options = Array.from(
			screen
				.getByLabelText<HTMLSelectElement>("Effectif")
				.querySelectorAll("option"),
		).map((option) => option.value);

		expect(options).toEqual([
			"",
			...(Object.keys(COMPANY_SIZE_RANGES) as CompanySizeRange[]),
		]);
	});

	it("restores the size bracket from the URL", () => {
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams({ sizeRange: "250+" }) as ReturnType<
				typeof useSearchParams
			>,
		);

		render(<SearchForm />);

		expect(screen.getByLabelText("Effectif")).toHaveValue("250+");
	});

	it("pushes the selected size bracket into the URL on submit", async () => {
		const push = mockRouterPush();
		const user = userEvent.setup();
		render(<SearchForm />);

		await user.selectOptions(screen.getByLabelText("Effectif"), "100-149");
		await user.click(screen.getByRole("button", { name: "Rechercher" }));

		await waitFor(() => expect(push).toHaveBeenCalled());
		const target = new URL(
			String(push.mock.calls[0]?.[0]),
			"https://example.fr",
		);
		expect(target.searchParams.get("sizeRange")).toBe("100-149");
	});

	it("clears the size bracket on reset", async () => {
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams({ sizeRange: "250+" }) as ReturnType<
				typeof useSearchParams
			>,
		);
		const push = mockRouterPush();
		const user = userEvent.setup();
		render(<SearchForm />);

		await user.click(screen.getByRole("button", { name: "Réinitialiser" }));

		expect(screen.getByLabelText("Effectif")).toHaveValue("");
		expect(push).toHaveBeenCalledWith("/admin/declarations");
	});
});
