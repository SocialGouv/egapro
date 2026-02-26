import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ErrorPage } from "../ErrorPage";

describe("ErrorPage", () => {
	it("renders the main landmark with skip-link target", () => {
		render(<ErrorPage />);

		const main = screen.getByRole("main");
		expect(main).toHaveAttribute("id", "content");
		expect(main).toHaveAttribute("tabIndex", "-1");
	});

	it("displays the 500 title", () => {
		render(<ErrorPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Erreur inattendue" }),
		).toBeInTheDocument();
	});

	it("displays the error code", () => {
		render(<ErrorPage />);

		expect(screen.getByText("Erreur 500")).toBeInTheDocument();
	});

	it("displays the apology text", () => {
		render(<ErrorPage />);

		expect(
			screen.getByText(/Désolé, le service rencontre un problème/),
		).toBeInTheDocument();
	});

	it("displays the retry guidance", () => {
		render(<ErrorPage />);

		expect(
			screen.getByText(
				/Essayez de rafraîchir la page ou bien réessayez plus tard/,
			),
		).toBeInTheDocument();
	});

	it("does not render any action button", () => {
		render(<ErrorPage />);

		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("renders a decorative error illustration image", () => {
		const { container } = render(<ErrorPage />);

		const img = container.querySelector("img");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("aria-hidden", "true");
		expect(img).toHaveAttribute("alt", "");
		expect(img).toHaveAttribute(
			"src",
			"/assets/images/error/technical-error-illustration.svg",
		);
	});
});
