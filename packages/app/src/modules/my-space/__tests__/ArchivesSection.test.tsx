import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchivesSection } from "../ArchivesSection";

describe("ArchivesSection", () => {
	it("renders the 'Archives' title as an h2 heading", () => {
		render(<ArchivesSection />);
		expect(
			screen.getByRole("heading", { level: 2, name: "Archives" }),
		).toBeInTheDocument();
	});

	it("renders the description text", () => {
		render(<ArchivesSection />);
		expect(
			screen.getByText(
				"Récupérer vos anciennes déclarations de l'index de l'égalité professionnelle femmes-hommes.",
			),
		).toBeInTheDocument();
	});

	it("renders an active link to the support Jira portal, opening in a new tab", () => {
		render(<ArchivesSection />);
		const link = screen.getByRole("link", {
			name: /Demander une déclaration archivée.*nouvelle fenêtre/,
		});
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute(
			"href",
			"https://jira-mcas.atlassian.net/servicedesk/customer/portal/97",
		);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});
});
