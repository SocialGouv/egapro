import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { publicationInfoItems } from "../PublicationSummary";

function renderItems(draft: Parameters<typeof publicationInfoItems>[0]) {
	const items = publicationInfoItems(draft);
	return render(
		<dl>
			{items.map((item) => (
				<div key={item.label}>
					<dt>{item.label}</dt>
					<dd>{item.value}</dd>
				</div>
			))}
		</dl>,
	);
}

describe("publicationInfoItems", () => {
	it("builds the offline publication rows", () => {
		renderItems({
			publishDate: "2026-03-01",
			hasWebsite: false,
			publishModalities: "Affichage dans les locaux.",
		});

		expect(screen.getByText("01/03/2026")).toBeInTheDocument();
		expect(screen.getByText("Non")).toBeInTheDocument();
		expect(screen.getByText("Affichage dans les locaux.")).toBeInTheDocument();
	});

	it("marks blank communication modalities with a dash", () => {
		renderItems({ hasWebsite: false, publishModalities: undefined });

		expect(
			screen.getByText("Modalités de communication").nextElementSibling,
		).toHaveTextContent("—");
	});

	it("renders a valid publication URL as a new-tab link", () => {
		renderItems({
			hasWebsite: true,
			publishUrl: "https://exemple.fr/egalite",
		});

		const link = screen.getByRole("link", {
			name: /exemple\.fr\/egalite.*nouvelle fenêtre/i,
		});
		expect(link).toHaveAttribute("href", "https://exemple.fr/egalite");
	});

	it("marks a blank publication URL with a dash", () => {
		renderItems({ hasWebsite: true, publishUrl: undefined });

		expect(
			screen.getByText("Adresse de la page (URL)").nextElementSibling,
		).toHaveTextContent("—");
	});

	it("renders an unparseable publication URL as plain text, not a link", () => {
		renderItems({ hasWebsite: true, publishUrl: "https://localhost" });

		expect(screen.getByText("https://localhost")).toBeInTheDocument();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});
});
