import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SecondDeclarationStep1Info } from "../SecondDeclarationStep1Info";

// Scoped SCSS classes resolve to their own key under the vitest scss module mock.
const SCOPED_CALLOUT_CLASS = "obligationsCallout";
const SCOPED_FONT_MEDIUM_CLASS = "fontMedium";

function renderStep1({
	cseOpinionRequired = true,
}: {
	cseOpinionRequired?: boolean;
} = {}) {
	render(
		<SecondDeclarationStep1Info
			cseOpinionRequired={cseOpinionRequired}
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

	it("displays the deadline with its label and no declaration date mention", () => {
		renderStep1();

		expect(
			screen.getByText("Échéance pour transmettre la seconde déclaration"),
		).toBeInTheDocument();
		expect(screen.getByText(/1ᵉʳ décembre 2027/)).toBeInTheDocument();
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

	it("lists the actions correctives then the CSE bullet then the redéclaration bullet when the CSE opinion is required", () => {
		renderStep1({ cseOpinionRequired: true });

		const items = screen.getAllByRole("listitem");
		expect(items).toHaveLength(3);
		expect(items[0]).toHaveTextContent(
			/Mettre en place des actions correctives/,
		);
		expect(items[1]).toHaveTextContent(
			/Informer et consulter votre CSE.*≥ 5 %.*dernière étape de la démarche/,
		);
		expect(items[2]).toHaveTextContent(/Redéclarer l.indicateur/);
		expect(
			screen.queryByText("Déposer le ou les avis du CSE"),
		).not.toBeInTheDocument();
	});

	it("lists only the actions correctives and redéclaration bullets when the CSE opinion is not required", () => {
		renderStep1({ cseOpinionRequired: false });

		const items = screen.getAllByRole("listitem");
		expect(items).toHaveLength(2);
		expect(items[0]).toHaveTextContent(
			/Mettre en place des actions correctives/,
		);
		expect(items[1]).toHaveTextContent(/Redéclarer l.indicateur/);
		expect(
			screen.queryByText(/Informer et consulter votre CSE/),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("Déposer le ou les avis du CSE"),
		).not.toBeInTheDocument();
	});

	it("renders previous link to parcours-conformite and next to step 2", () => {
		renderStep1();

		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
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

	it("renders the intro paragraph in uniform medium weight without emphasis", () => {
		renderStep1();

		const intro = screen.getByText(/Vous devez mettre en œuvre des/);
		expect(intro).toHaveClass(SCOPED_FONT_MEDIUM_CLASS);
		expect(intro.querySelector("strong")).toBeNull();
	});

	it("announces the next step in the stepper details", () => {
		renderStep1();

		expect(
			screen.getByText(
				"Seconde déclaration de l'indicateur par catégorie d'emplois",
			),
		).toBeInTheDocument();
	});

	it("neutralises the top margin of the form actions", () => {
		renderStep1();

		expect(
			screen.getByRole("link", { name: /précédent/i }).parentElement,
		).toHaveClass("fr-mt-0");
	});
});
