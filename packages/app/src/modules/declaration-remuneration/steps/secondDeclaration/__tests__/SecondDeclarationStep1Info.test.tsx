import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SecondDeclarationStep1Info } from "../SecondDeclarationStep1Info";

describe("SecondDeclarationStep1Info", () => {
	const modificationDeadline = new Date("2027-12-01T00:00:00");

	it("renders the main title", () => {
		render(
			<SecondDeclarationStep1Info
				declarationDate="01/06/2027"
				modificationDeadline={modificationDeadline}
			/>,
		);
		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l.indicateur par catégorie de salariés/,
			),
		).toBeInTheDocument();
	});

	it("renders stepper at step 1 of 3", () => {
		render(
			<SecondDeclarationStep1Info
				declarationDate="01/06/2027"
				modificationDeadline={modificationDeadline}
			/>,
		);
		expect(screen.getByText("Étape 1 sur 3")).toBeInTheDocument();
		expect(
			screen.getByText("Actions correctives et seconde déclaration"),
		).toBeInTheDocument();
	});

	it("displays the deadline", () => {
		render(
			<SecondDeclarationStep1Info
				declarationDate="01/06/2027"
				modificationDeadline={modificationDeadline}
			/>,
		);
		expect(screen.getByText(/1 décembre 2027/)).toBeInTheDocument();
	});

	it("displays the declaration date", () => {
		render(
			<SecondDeclarationStep1Info
				declarationDate="01/06/2027"
				modificationDeadline={modificationDeadline}
			/>,
		);
		expect(
			screen.getByText(/Déclaration effectuée le 01\/06\/2027/),
		).toBeInTheDocument();
	});

	it("renders the obligations callout", () => {
		render(
			<SecondDeclarationStep1Info
				declarationDate="01/06/2027"
				modificationDeadline={modificationDeadline}
			/>,
		);
		expect(
			screen.getByText("Ce que vous devez faire dans un délai de 6 mois"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Mettre en place des actions correctives/),
		).toBeInTheDocument();
	});

	it("renders previous link to parcours-conformite and next to step 2", () => {
		render(
			<SecondDeclarationStep1Info
				declarationDate="01/06/2027"
				modificationDeadline={modificationDeadline}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/2",
		);
	});
});
