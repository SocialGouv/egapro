import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerPush = vi.fn();

vi.mock("next/navigation", async () => {
	const actual =
		await vi.importActual<typeof import("next/navigation")>("next/navigation");
	return {
		...actual,
		useRouter: () => ({ push: routerPush }),
		useSearchParams: () => new URLSearchParams(),
	};
});

import { SearchForm } from "../SearchForm";

describe("SearchForm", () => {
	beforeEach(() => {
		routerPush.mockClear();
	});

	it("disables the county select until a region is chosen", () => {
		render(<SearchForm />);
		const county = screen.getByLabelText("Département") as HTMLSelectElement;
		expect(county).toBeDisabled();
		expect(county).toHaveDisplayValue("Choisir une région d'abord");
	});

	it("enables the county select when a region is selected", () => {
		render(<SearchForm />);
		const region = screen.getByLabelText("Région") as HTMLSelectElement;
		fireEvent.change(region, { target: { value: "11" } });
		const county = screen.getByLabelText("Département") as HTMLSelectElement;
		expect(county).not.toBeDisabled();
	});

	it("pushes a URL with the submitted filters on search", async () => {
		render(<SearchForm />);
		fireEvent.input(screen.getByLabelText("Nom du référent"), {
			target: { value: "Jean" },
		});
		fireEvent.change(screen.getByLabelText("Région"), {
			target: { value: "11" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

		await waitFor(() => {
			expect(routerPush).toHaveBeenCalledWith(
				expect.stringMatching(/\/admin\/liste-referents\?.*query=Jean/),
			);
		});
		expect(routerPush).toHaveBeenCalledWith(expect.stringMatching(/region=11/));
		expect(routerPush).toHaveBeenCalledWith(expect.stringMatching(/page=1/));
	});

	it("resets and pushes the base URL on Réinitialiser", () => {
		render(<SearchForm />);
		fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));
		expect(routerPush).toHaveBeenCalledWith("/admin/liste-referents");
	});
});
