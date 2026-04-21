import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
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

import { SearchForm } from "../SearchForm";

describe("SearchForm", () => {
	it("renders all search fields", () => {
		render(<SearchForm />);

		expect(screen.getByLabelText("SIREN / Nom entreprise")).toBeInTheDocument();
		expect(screen.getByLabelText("Email déclarant")).toBeInTheDocument();
		expect(screen.getByLabelText("Année")).toBeInTheDocument();
		expect(screen.getByLabelText("Date de dépôt (du)")).toBeInTheDocument();
		expect(screen.getByLabelText("Date de dépôt (au)")).toBeInTheDocument();
		expect(screen.getByLabelText("Statut")).toBeInTheDocument();
	});

	it("does not render removed Index / Valeur filters", () => {
		render(<SearchForm />);
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
});
