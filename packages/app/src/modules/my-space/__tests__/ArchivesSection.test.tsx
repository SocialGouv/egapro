import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchivesSection } from "../ArchivesSection";

describe("ArchivesSection", () => {
	it("renders the 'Archives' title", () => {
		render(<ArchivesSection />);
		expect(screen.getByText("Archives")).toBeInTheDocument();
	});

	it("renders the description text", () => {
		render(<ArchivesSection />);
		expect(
			screen.getByText(
				"Récupérer vos anciennes déclarations de l'index de l'égalité professionnelle femmes-hommes.",
			),
		).toBeInTheDocument();
	});

	it("renders the disabled button", () => {
		render(<ArchivesSection />);
		const button = screen.getByRole("button", {
			name: "Demander une déclaration archivée",
		});
		expect(button).toBeInTheDocument();
		expect(button).toBeDisabled();
	});
});
