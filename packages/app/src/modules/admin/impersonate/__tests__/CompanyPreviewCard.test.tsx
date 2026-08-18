import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";

import { GIP_WORKFORCE_VOLUNTARY_DISPLAY } from "~/modules/domain";
import { CompanyPreviewCard } from "../CompanyPreviewCard";

type PreviewCompany = ComponentProps<typeof CompanyPreviewCard>["company"];

const BASE_COMPANY: PreviewCompany = {
	siren: "123456789",
	name: "ACME",
	address: null,
	nafCode: null,
	workforce: null,
	workforceYear: 2026,
};

function renderCard(overrides: Partial<PreviewCompany> = {}) {
	render(<CompanyPreviewCard company={{ ...BASE_COMPANY, ...overrides }} />);
}

describe("CompanyPreviewCard", () => {
	it("renders all company fields when present", () => {
		renderCard({
			address: "10 Rue de la Paix",
			nafCode: "62.01Z",
			workforce: 42,
		});

		expect(screen.getByText("ACME")).toBeInTheDocument();
		expect(screen.getByText("123456789")).toBeInTheDocument();
		expect(screen.getByText("10 Rue de la Paix")).toBeInTheDocument();
		expect(screen.getByText("62.01Z")).toBeInTheDocument();
		expect(screen.getByText("42")).toBeInTheDocument();
	});

	it("omits the optional identity fields when null", () => {
		renderCard();

		expect(screen.queryByText(/Adresse/)).not.toBeInTheDocument();
		expect(screen.queryByText(/Code NAF/)).not.toBeInTheDocument();
	});

	it("dates the headcount with the GIP campaign year it was read on", () => {
		renderCard({ workforce: 120, workforceYear: 2031 });

		expect(
			screen.getByText("Effectif annuel moyen en 2031 :"),
		).toBeInTheDocument();
	});

	it("renders a workforce of 0", () => {
		renderCard({ workforce: 0 });

		expect(screen.getByText("0")).toBeInTheDocument();
	});

	// `floorWorkforce` and `formatWorkforceForUser` are deliberate opposites and
	// TypeScript catches neither inversion — a number and a string both render.
	// These two cases are the only thing holding the back-office to the exact
	// figure, and holding an absence to an absence.
	it("shows the exact headcount of a voluntary-tier company, never the user-facing bracket", () => {
		renderCard({ workforce: 37 });

		expect(screen.getByText("37")).toBeInTheDocument();
		expect(
			screen.queryByText(GIP_WORKFORCE_VOLUNTARY_DISPLAY),
		).not.toBeInTheDocument();
	});

	it("shows a dash for a company absent from the GIP file, neither the bracket nor a zero", () => {
		renderCard({ workforce: null });

		expect(screen.getByText("—")).toBeInTheDocument();
		expect(
			screen.queryByText(GIP_WORKFORCE_VOLUNTARY_DISPLAY),
		).not.toBeInTheDocument();
		expect(screen.queryByText("0")).not.toBeInTheDocument();
	});
});
