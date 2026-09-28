import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpinionSummaryBox } from "../components/OpinionSummaryBox";
import type { ContentTypeColumn } from "../types";

const accuracy1: ContentTypeColumn = {
	id: "1:accuracy",
	declarationNumber: 1,
	type: "accuracy",
	label: "Exactitude",
	declarationLabel: null,
	description: "Exactitude première déclaration",
	missingMessage: "manquant",
};
const gap1: ContentTypeColumn = {
	id: "1:gap",
	declarationNumber: 1,
	type: "gap",
	label: "Justification",
	declarationLabel: null,
	description: "Justification des écarts",
	missingMessage: "manquant",
};
const accuracy2: ContentTypeColumn = {
	id: "2:accuracy",
	declarationNumber: 2,
	type: "accuracy",
	label: "Exactitude",
	declarationLabel: "2e déclaration",
	description: "Exactitude seconde déclaration",
	missingMessage: "manquant",
};

describe("OpinionSummaryBox", () => {
	it("renders the section title", () => {
		render(<OpinionSummaryBox associations={{}} columns={[accuracy1]} />);

		expect(screen.getByText("Avis CSE à transmettre :")).toBeInTheDocument();
	});

	it("shows per-declaration headings only when two declarations are present", () => {
		render(
			<OpinionSummaryBox
				associations={{}}
				columns={[accuracy1, gap1, accuracy2]}
			/>,
		);

		expect(screen.getByText("Première déclaration")).toBeInTheDocument();
		expect(screen.getByText("Deuxième déclaration")).toBeInTheDocument();
		expect(
			screen.getByText("Exactitude première déclaration"),
		).toBeInTheDocument();
		expect(screen.getByText("Justification des écarts")).toBeInTheDocument();
		expect(
			screen.getByText("Exactitude seconde déclaration"),
		).toBeInTheDocument();
	});

	it("omits both declaration headings when there is a single declaration", () => {
		render(<OpinionSummaryBox associations={{}} columns={[accuracy1, gap1]} />);

		expect(screen.queryByText("Première déclaration")).not.toBeInTheDocument();
		expect(screen.queryByText("Deuxième déclaration")).not.toBeInTheDocument();
		// The obligations themselves are still listed.
		expect(
			screen.getByText("Exactitude première déclaration"),
		).toBeInTheDocument();
	});

	it("marks only the obligations whose column has an associated file", () => {
		render(
			<OpinionSummaryBox
				associations={{ "1:accuracy": "file-1" }}
				columns={[accuracy1, gap1]}
			/>,
		);

		// The check marker exposes an sr-only "Avis joint :" label.
		expect(screen.getAllByText("Avis joint :")).toHaveLength(1);
	});
});
