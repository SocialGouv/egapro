import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicReferentList } from "../PublicReferentList";
import type { PublicReferentListRow } from "../types";

const sampleRows: PublicReferentListRow[] = [
	{
		id: "r-1",
		region: "11",
		county: "75",
		name: "Marie Durand",
		principal: true,
	},
	{
		id: "r-2",
		region: "11",
		county: null,
		name: "Paul Martin",
		principal: false,
	},
];

describe("PublicReferentList", () => {
	it("renders an empty state when no rows", () => {
		render(<PublicReferentList rows={[]} />);
		expect(screen.getByText(/aucun référent/i)).toBeInTheDocument();
	});

	it("renders one <li> per referent with name and region", () => {
		render(<PublicReferentList rows={sampleRows} />);
		const items = screen.getAllByRole("listitem");
		expect(items).toHaveLength(2);
		expect(screen.getByText("Marie Durand")).toBeInTheDocument();
		expect(screen.getByText("Paul Martin")).toBeInTheDocument();
	});

	it("renders the département label only when county is provided", () => {
		render(<PublicReferentList rows={sampleRows} />);
		expect(screen.getByText(/Île-de-France — Paris/)).toBeInTheDocument();
		const withoutCounty = screen.getAllByText(/Île-de-France/)[1];
		expect(withoutCounty?.textContent).not.toContain("—");
	});

	it("renders the principal badge only when principal is true", () => {
		render(<PublicReferentList rows={sampleRows} />);
		const badges = screen.getAllByText(/référent principal/i);
		expect(badges).toHaveLength(1);
	});

	it("renders a link to the detail page for each referent (no contact shown)", () => {
		render(<PublicReferentList rows={sampleRows} />);
		const marieLink = screen.getByRole("link", {
			name: /voir le contact de marie durand/i,
		});
		expect(marieLink).toHaveAttribute("href", "/referents/r-1");
		const paulLink = screen.getByRole("link", {
			name: /voir le contact de paul martin/i,
		});
		expect(paulLink).toHaveAttribute("href", "/referents/r-2");
	});
});
