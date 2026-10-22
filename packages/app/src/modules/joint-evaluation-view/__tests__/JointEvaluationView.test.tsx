import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JointEvaluationView } from "../JointEvaluationView";

const baseProps = {
	company: {
		name: "Entreprise Exemple",
		siren: "123456789",
		address: "1 rue de Paris",
		countryCode: "FR",
		countryLabel: "France",
		departmentLabel: "Paris",
		gipWorkforce: 150,
		nafCode: "62.01Z",
		nafLabel: "Programmation informatique",
		hasCse: true,
	},
	declarant: {
		firstName: "Marie",
		lastName: "Dupont",
		email: "marie@example.fr",
		phone: "01 02 03 04 05",
	},
	file: {
		id: "report-1",
		fileName: "rapport.pdf",
		uploadedAt: new Date("2027-04-01T10:00:00Z"),
	},
	referencePeriod: "01/01/2026 - 31/12/2026",
	submittedAt: new Date("2027-04-03T12:00:00Z"),
	year: 2027,
};

describe("JointEvaluationView", () => {
	it("shows the transmission date, declarant and company details, and active report", () => {
		render(<JointEvaluationView {...baseProps} />);
		expect(
			screen.getByText("La déclaration a été transmise le 03/04/2027"),
		).toBeInTheDocument();
		expect(screen.getByText("Marie Dupont")).toBeInTheDocument();
		expect(screen.getByText("01 02 03 04 05")).toBeInTheDocument();
		expect(
			screen.getByText("62.01Z — Programmation informatique"),
		).toBeInTheDocument();
		expect(screen.getByText("01/01/2026 - 31/12/2026")).toBeInTheDocument();
		const link = screen.getByRole("link", { name: /rapport.pdf/ });
		expect(link).toHaveAttribute("href", "/api/v1/files/report-1");
		const companySection = screen.getByRole("heading", {
			name: "Entreprise",
		}).parentElement;
		expect(companySection).not.toBeNull();
		expect(
			within(companySection as HTMLElement).getByText("Oui"),
		).toBeInTheDocument();
	});

	it("hides CSE status for companies with fewer than 100 employees", () => {
		render(
			<JointEvaluationView
				{...baseProps}
				company={{ ...baseProps.company, gipWorkforce: 99 }}
			/>,
		);
		expect(screen.queryByText("Existence d’un CSE")).not.toBeInTheDocument();
	});
});
