import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminAccessDeniedPage } from "../AdminAccessDeniedPage";

describe("AdminAccessDeniedPage", () => {
	it("renders the main landmark with the skip-link target", () => {
		render(
			<AdminAccessDeniedPage
				organizationLabel="Société Démo"
				roles={["agent_public_etat"]}
				siret="12345678900012"
			/>,
		);

		const main = screen.getByRole("main");
		expect(main).toHaveAttribute("id", "content");
		expect(main).toHaveAttribute("tabIndex", "-1");
	});

	it("states the blocking rule, the roles, the organization and the SIRET", () => {
		render(
			<AdminAccessDeniedPage
				organizationLabel="Société Démo"
				roles={["agent_public_etat"]}
				siret="12345678900012"
			/>,
		);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Accès à l'administration refusé",
			}),
		).toBeInTheDocument();
		expect(screen.getByText(/réservé aux agents publics/)).toBeInTheDocument();
		expect(screen.getByText(/agent_public_etat/)).toBeInTheDocument();
		expect(screen.getByText(/Société Démo/)).toBeInTheDocument();
		expect(screen.getByText(/12345678900012/)).toBeInTheDocument();
	});

	it("reads an empty roles list as « aucun »", () => {
		render(
			<AdminAccessDeniedPage
				organizationLabel="Société Démo"
				roles={[]}
				siret="12345678900012"
			/>,
		);

		expect(screen.getByText(/aucun/)).toBeInTheDocument();
	});

	it("falls back to « non communiqué » for a missing organization name and SIRET", () => {
		render(
			<AdminAccessDeniedPage
				organizationLabel={null}
				roles={[]}
				siret={null}
			/>,
		);

		const occurrences =
			screen
				.getByText(/non communiqué/)
				.textContent?.match(/non communiqué/g) ?? [];
		expect(occurrences).toHaveLength(2);
	});

	it("offers Mon espace and the Contact page, never a ProConnect reconnection", () => {
		render(
			<AdminAccessDeniedPage
				organizationLabel={null}
				roles={[]}
				siret={null}
			/>,
		);

		expect(
			screen.getByRole("link", { name: "Retourner à Mon espace" }),
		).toHaveAttribute("href", "/mon-espace");
		expect(
			screen.getByRole("link", { name: "Contacter l'équipe Egapro" }),
		).toHaveAttribute("href", "/aide/nous-contacter");
		expect(
			screen.queryByRole("button", {
				name: /double authentification/i,
			}),
		).not.toBeInTheDocument();
	});
});
