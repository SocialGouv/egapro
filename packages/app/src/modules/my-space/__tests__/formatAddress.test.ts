import { describe, expect, it } from "vitest";

import { formatAddress } from "../formatAddress";

describe("formatAddress", () => {
	it("title-cases a fully uppercase address", () => {
		expect(formatAddress("10 RUE DE LA PAIX")).toBe("10 Rue de la Paix");
	});

	it("keeps connector words lowercase except at the start", () => {
		expect(formatAddress("DE GAULLE")).toBe("De Gaulle");
		expect(formatAddress("AVENUE DES CHAMPS")).toBe("Avenue des Champs");
	});

	it("handles accents", () => {
		expect(formatAddress("PLACE DE L'ÉTOILE")).toBe("Place de l'Étoile");
	});

	it("handles multiple connector words", () => {
		expect(formatAddress("RUE DU BOIS ET DES FLEURS")).toBe(
			"Rue du Bois et des Fleurs",
		);
	});
});
