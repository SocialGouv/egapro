import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicReferentDetail } from "../PublicReferentDetail";
import type { PublicReferentDetail as PublicReferentDetailData } from "../types";

const baseReferent: PublicReferentDetailData = {
	id: "11111111-1111-4111-8111-111111111111",
	region: "11",
	county: "75",
	name: "Marie Durand",
	type: "email",
	value: "marie.durand@dreets.gouv.fr",
	principal: true,
	substituteName: null,
	substituteEmail: null,
};

describe("PublicReferentDetail", () => {
	it("renders name and region/département", () => {
		render(<PublicReferentDetail referent={baseReferent} />);
		expect(
			screen.getByRole("heading", { level: 1, name: /marie durand/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/Île-de-France/)).toBeInTheDocument();
		expect(screen.getByText(/Paris/)).toBeInTheDocument();
	});

	it("shows the principal badge when principal is true", () => {
		render(<PublicReferentDetail referent={baseReferent} />);
		expect(screen.getByText(/référent principal/i)).toBeInTheDocument();
	});

	it("does not show the principal badge when principal is false", () => {
		render(
			<PublicReferentDetail referent={{ ...baseReferent, principal: false }} />,
		);
		expect(screen.queryByText(/référent principal/i)).not.toBeInTheDocument();
	});

	it("renders an email contact as a mailto link", () => {
		render(<PublicReferentDetail referent={baseReferent} />);
		const link = screen.getByRole("link", {
			name: /marie\.durand@dreets\.gouv\.fr/,
		});
		expect(link).toHaveAttribute("href", "mailto:marie.durand@dreets.gouv.fr");
	});

	it("renders a URL contact as an external link with NewTabNotice", () => {
		render(
			<PublicReferentDetail
				referent={{
					...baseReferent,
					type: "url",
					value: "https://dreets.gouv.fr/contact",
				}}
			/>,
		);
		const link = screen.getByRole("link", {
			name: /dreets\.gouv\.fr\/contact/i,
		});
		expect(link).toHaveAttribute("href", "https://dreets.gouv.fr/contact");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("renders substitute block when substituteName is provided", () => {
		render(
			<PublicReferentDetail
				referent={{
					...baseReferent,
					substituteName: "Paul Martin",
					substituteEmail: "paul.martin@dreets.gouv.fr",
				}}
			/>,
		);
		expect(screen.getByText("Paul Martin")).toBeInTheDocument();
		const substituteEmailLink = screen.getByRole("link", {
			name: /paul\.martin@dreets\.gouv\.fr/,
		});
		expect(substituteEmailLink).toHaveAttribute(
			"href",
			"mailto:paul.martin@dreets.gouv.fr",
		);
	});

	it("does not render substitute block when substituteName is null", () => {
		render(<PublicReferentDetail referent={baseReferent} />);
		expect(screen.queryByText(/suppléant/i)).not.toBeInTheDocument();
	});

	it("renders a back link to the search page", () => {
		render(<PublicReferentDetail referent={baseReferent} />);
		const backLink = screen.getByRole("link", {
			name: /retour à la recherche/i,
		});
		expect(backLink).toHaveAttribute("href", "/referents");
	});

	it("main has id=content for skip-links", () => {
		render(<PublicReferentDetail referent={baseReferent} />);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("falls back to region/county code if the label is unknown", () => {
		render(
			<PublicReferentDetail
				referent={{
					...baseReferent,
					region: "99" as PublicReferentDetailData["region"],
					county: "99" as PublicReferentDetailData["county"],
				}}
			/>,
		);
		expect(screen.getByText(/^99/)).toBeInTheDocument();
	});
});
