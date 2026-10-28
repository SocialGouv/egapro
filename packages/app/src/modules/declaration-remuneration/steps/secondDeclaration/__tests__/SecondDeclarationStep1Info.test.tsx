import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SecondDeclarationStep1Info } from "../SecondDeclarationStep1Info";

// Scoped SCSS classes resolve to their own key under the vitest scss module mock.
const SCOPED_CALLOUT_CLASS = "obligationsCallout";
const SCOPED_FONT_MEDIUM_CLASS = "fontMedium";

function renderStep1() {
	render(
		<SecondDeclarationStep1Info
			declarationSiren="123456789"
			declarationYear={2027}
			modificationDeadline={new Date("2027-12-01T00:00:00Z")}
		/>,
	);
}

describe("SecondDeclarationStep1Info", () => {
	it("renders the main title", () => {
		renderStep1();

		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l.indicateur par catégorie d'emplois/,
			),
		).toBeInTheDocument();
	});

	it("renders stepper at step 1 of 3", () => {
		renderStep1();

		expect(screen.getByText("Étape 1 sur 3")).toBeInTheDocument();
		expect(
			screen.getByText("Actions correctives et seconde déclaration"),
		).toBeInTheDocument();
	});

	it("displays the deadline", () => {
		renderStep1();

		expect(screen.getByText(/1ᵉʳ décembre 2027/)).toBeInTheDocument();
	});

	it("no longer recalls the date of the first declaration", () => {
		renderStep1();

		expect(
			screen.queryByText(/Déclaration effectuée le/),
		).not.toBeInTheDocument();
	});

	it("renders the obligations callout", () => {
		renderStep1();

		expect(
			screen.getByText("Ce que vous devez faire dans un délai de 6 mois"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Mettre en place des actions correctives/),
		).toBeInTheDocument();
	});

	it("lists the three obligations in the order of the mock-up, the CSE opinion being transmitted at the last step", () => {
		renderStep1();

		const items = screen.getAllByRole("listitem").map((li) => li.textContent);
		expect(items).toEqual([
			"Mettre en place des actions correctives par accord ou plan d'action",
			"Informer et consulter votre CSE sur l'exactitude des données et éventuellement sur la justification en cas d'écarts ≥ 5 % (l'avis devra être transmis à la dernière étape de la démarche)",
			"Redéclarer l'indicateur dans un délai de 6 mois après votre première déclaration",
		]);
		expect(
			screen.queryByText("Déposer le ou les avis du CSE"),
		).not.toBeInTheDocument();
	});

	it("renders next to step 2 without a previous link back to the transmitted path choice", () => {
		renderStep1();

		expect(
			screen.queryByRole("link", { name: /précédent/i }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/2",
		);
	});

	it("renders the deadline block as a DSFR highlight", () => {
		renderStep1();

		const deadlineBlock = screen.getByText(
			"Échéance pour transmettre la seconde déclaration",
		).parentElement;
		expect(deadlineBlock).toHaveClass("fr-highlight");
		expect(deadlineBlock).not.toHaveClass("fr-pl-3w");
	});

	it("renders the deadline lines with the expected DSFR typography", () => {
		renderStep1();

		expect(
			screen.getByText("Échéance pour transmettre la seconde déclaration"),
		).not.toHaveClass("fr-text--sm");

		const deadlineDate = screen.getByText(/1ᵉʳ décembre 2027/);
		expect(deadlineDate).toHaveClass("fr-text--lead", "fr-text--bold");
		expect(deadlineDate).not.toHaveClass("fr-h5");
	});

	it("renders the obligations callout with the scoped styling", () => {
		renderStep1();

		const title = screen.getByRole("heading", {
			level: 3,
			name: "Ce que vous devez faire dans un délai de 6 mois",
		});
		expect(title).toHaveClass("fr-callout__title", "fr-h6");
		expect(title.parentElement).toHaveClass("fr-callout", SCOPED_CALLOUT_CLASS);
	});

	it("renders the intro paragraph in medium weight while keeping its emphasis", () => {
		renderStep1();

		expect(screen.getByText(/Vous devez mettre en œuvre des/)).toHaveClass(
			SCOPED_FONT_MEDIUM_CLASS,
		);
		expect(screen.getByText("actions correctives").tagName).toBe("STRONG");
		expect(
			screen.getByText(
				/^seconde déclaration de l.indicateur par catégorie d'emplois$/,
			).tagName,
		).toBe("STRONG");
	});

	it("neutralises the top margin of the form actions", () => {
		renderStep1();

		expect(
			screen.getByRole("link", { name: /suivant/i }).parentElement,
		).toHaveClass("fr-mt-0");
	});
});
