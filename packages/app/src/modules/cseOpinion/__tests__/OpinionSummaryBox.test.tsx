import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpinionSummaryBox } from "../components/OpinionSummaryBox";

describe("OpinionSummaryBox", () => {
	const defaultProps = {
		firstDeclTitle: "Exactitude première déclaration",
		secondDeclTitle: "Exactitude seconde déclaration",
		secondDeclGapTitle: "Justification des écarts",
	};

	it("renders the section title", () => {
		render(<OpinionSummaryBox {...defaultProps} />);

		expect(screen.getByText("Avis CSE à transmettre :")).toBeInTheDocument();
	});

	it("renders first declaration items", () => {
		render(<OpinionSummaryBox {...defaultProps} />);

		expect(screen.getByText("Première déclaration")).toBeInTheDocument();
		expect(
			screen.getByText("Exactitude première déclaration"),
		).toBeInTheDocument();
	});

	it("renders second declaration items", () => {
		render(<OpinionSummaryBox {...defaultProps} showSecondDeclaration />);

		expect(screen.getByText("Deuxième déclaration")).toBeInTheDocument();
		expect(
			screen.getByText("Exactitude seconde déclaration"),
		).toBeInTheDocument();
		expect(screen.getByText("Justification des écarts")).toBeInTheDocument();
	});
});
