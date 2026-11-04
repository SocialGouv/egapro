import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }));

vi.mock("~/modules/analytics", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/analytics")>();
	return { ...actual, trackEvent: trackEventMock };
});

import { MATOMO_ACTION, MATOMO_EVENT_CATEGORY } from "~/modules/analytics";
import { HomeSearchForm } from "../HomeSearchForm";

const LABEL =
	"Recherchez une entreprise par son nom ou son numéro SIREN (9 chiffres).";

beforeEach(() => {
	trackEventMock.mockReset();
});

describe("HomeSearchForm", () => {
	it("submits a GET to the observatory search with the query as q", () => {
		render(<HomeSearchForm />);

		const form = screen.getByRole("form", {
			name: "Rechercher une entreprise",
		});
		expect(form).toHaveAttribute("action", "/index-egapro/recherche");
		expect(form).toHaveAttribute("method", "GET");
		expect(screen.getByLabelText(LABEL)).toHaveAttribute("name", "q");
	});

	it("names the single search field with the visible sentence", () => {
		render(<HomeSearchForm />);

		const input = screen.getByRole("searchbox", { name: LABEL });
		expect(input).toHaveAttribute("placeholder", "Rechercher une entreprise");
		expect(screen.getByText(LABEL).closest(".fr-search-bar")).toBeNull();
		expect(screen.getAllByRole("searchbox")).toHaveLength(1);
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	});

	it("renders the large DSFR search bar with its submit button", () => {
		render(<HomeSearchForm />);

		const button = screen.getByRole("button", { name: "Rechercher" });
		expect(button).toHaveAttribute("type", "submit");
		expect(button.closest(".fr-search-bar")).toHaveClass("fr-search-bar--lg");
	});

	it("offers a help button about the companies subject to the obligation", () => {
		render(<HomeSearchForm />);

		expect(
			screen.getByRole("button", {
				name: "Information sur les entreprises assujetties",
			}),
		).toHaveAccessibleDescription(
			"Les entreprises assujetties sont celles qui comptent au moins 50 salariés.",
		);
	});
});

describe("HomeSearchForm tracking", () => {
	it("reports q when a query is typed", () => {
		render(<HomeSearchForm />);

		fireEvent.change(screen.getByLabelText(LABEL), {
			target: { value: "Société Démo" },
		});
		fireEvent.submit(screen.getByRole("form"));

		expect(trackEventMock).toHaveBeenCalledTimes(1);
		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.SEARCH,
			action: MATOMO_ACTION.SEARCH_SUBMIT,
			name: "q",
		});
	});

	it("never leaks the raw search query (no PII in the payload)", () => {
		render(<HomeSearchForm />);

		fireEvent.change(screen.getByLabelText(LABEL), {
			target: { value: "123456789 Société Démo" },
		});
		fireEvent.submit(screen.getByRole("form"));

		const payload = JSON.stringify(trackEventMock.mock.calls[0]?.[0]);
		expect(payload).not.toContain("123456789");
		expect(payload).not.toContain("Démo");
	});

	it("reports 'empty' when nothing or only spaces are typed", () => {
		render(<HomeSearchForm />);

		fireEvent.change(screen.getByLabelText(LABEL), {
			target: { value: "   " },
		});
		fireEvent.submit(screen.getByRole("form"));

		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.SEARCH,
			action: MATOMO_ACTION.SEARCH_SUBMIT,
			name: "empty",
		});
	});
});
