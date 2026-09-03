import { describe, expect, it } from "vitest";

import { formatInseeTitleCase } from "../formatInseeTitleCase";

describe("formatInseeTitleCase", () => {
	it("title-cases a fully uppercase address", () => {
		expect(formatInseeTitleCase("10 RUE DE LA PAIX")).toBe("10 Rue de la Paix");
	});

	it("keeps connector words lowercase except at the start", () => {
		expect(formatInseeTitleCase("DE GAULLE")).toBe("De Gaulle");
		expect(formatInseeTitleCase("AVENUE DES CHAMPS")).toBe("Avenue des Champs");
	});

	it("handles accents", () => {
		expect(formatInseeTitleCase("PLACE DE L'ÉTOILE")).toBe("Place de l'Étoile");
	});

	it("handles multiple connector words", () => {
		expect(formatInseeTitleCase("RUE DU BOIS ET DES FLEURS")).toBe(
			"Rue du Bois et des Fleurs",
		);
	});

	it("title-cases a single-word country label", () => {
		expect(formatInseeTitleCase("QATAR")).toBe("Qatar");
	});

	it("title-cases a composed country label", () => {
		expect(formatInseeTitleCase("AFRIQUE DU SUD")).toBe("Afrique du Sud");
	});

	it("keeps the hyphen and title-cases both sides for a hyphenated country label", () => {
		expect(formatInseeTitleCase("PAYS-BAS")).toBe("Pays-Bas");
	});

	it("handles an apostrophe in a country label", () => {
		expect(formatInseeTitleCase("CÔTE D'IVOIRE")).toBe("Côte d'Ivoire");
	});
});
