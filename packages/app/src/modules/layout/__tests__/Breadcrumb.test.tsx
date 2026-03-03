import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Breadcrumb } from "../Breadcrumb";

describe("Breadcrumb", () => {
	it("renders DSFR breadcrumb structure with nav, button, and list", () => {
		render(
			<Breadcrumb
				items={[{ label: "Accueil", href: "/" }, { label: "Page courante" }]}
			/>,
		);

		const nav = screen.getByRole("navigation", { name: /vous êtes ici/i });
		expect(nav).toBeInTheDocument();

		expect(
			within(nav).getByRole("button", { name: /voir le fil d'ariane/i }),
		).toBeInTheDocument();

		expect(within(nav).getByRole("list")).toBeInTheDocument();
	});

	it("renders parent items as links with correct href", () => {
		render(
			<Breadcrumb
				items={[
					{ label: "Accueil", href: "/" },
					{ label: "Aide", href: "/aide" },
					{ label: "Nous contacter" },
				]}
			/>,
		);

		const nav = screen.getByRole("navigation", { name: /vous êtes ici/i });

		const accueilLink = within(nav).getByRole("link", { name: /accueil/i });
		expect(accueilLink).toHaveAttribute("href", "/");

		const aideLink = within(nav).getByRole("link", { name: /aide/i });
		expect(aideLink).toHaveAttribute("href", "/aide");
	});

	it("renders last item with aria-current='page' and no href", () => {
		render(
			<Breadcrumb
				items={[{ label: "Accueil", href: "/" }, { label: "Plan du site" }]}
			/>,
		);

		const currentItem = screen.getByText("Plan du site");
		expect(currentItem).toHaveAttribute("aria-current", "page");
		expect(currentItem).not.toHaveAttribute("href");
	});

	it("renders nothing when items array is empty", () => {
		const { container } = render(<Breadcrumb items={[]} />);
		expect(container.innerHTML).toBe("");
	});

	it("links aria-controls to collapse container id", () => {
		render(
			<Breadcrumb
				items={[{ label: "Accueil", href: "/" }, { label: "FAQ" }]}
			/>,
		);

		const button = screen.getByRole("button", {
			name: /voir le fil d'ariane/i,
		});
		const controlsId = button.getAttribute("aria-controls") ?? "";
		expect(controlsId).toBeTruthy();
		expect(document.getElementById(controlsId)).toBeInTheDocument();
	});
});
