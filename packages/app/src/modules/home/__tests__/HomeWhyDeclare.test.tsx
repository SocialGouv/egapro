import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { civilDate } from "~/modules/domain";
import { HomeWhyDeclare } from "../HomeWhyDeclare";

const NNBSP = " ";

function renderSection() {
	return render(
		<HomeWhyDeclare
			remunerationDeadline={civilDate(2027, 5, 1)}
			representationDeadline={civilDate(2027, 9, 15)}
		/>,
	);
}

function card(title: string): HTMLElement {
	const heading = screen.getByRole("heading", { level: 3, name: title });
	const element = heading.closest<HTMLElement>(".fr-card");
	if (!element) throw new Error(`No card around ${title}`);
	return element;
}

describe("HomeWhyDeclare", () => {
	it("renders the section heading", () => {
		renderSection();

		expect(
			screen.getByRole("heading", { level: 2, name: "Pourquoi déclarer ?" }),
		).toBeInTheDocument();
	});

	it("renders two horizontal DSFR cards whose whole surface links to the holding page", () => {
		renderSection();

		for (const title of [
			"Indicateurs de rémunération",
			"Indicateurs de représentation",
		]) {
			const element = card(title);
			expect(element).toHaveClass(
				"fr-card",
				"fr-card--horizontal",
				"fr-enlarge-link",
			);
			expect(
				within(element).getByRole("link", { name: title }),
			).toHaveAttribute("href", "/en-construction");
		}
	});

	it("shows the configured deadlines as day and month", () => {
		renderSection();

		expect(
			within(card("Indicateurs de rémunération")).getByText(
				"Échéance au 1ᵉʳ juin",
			),
		).toHaveClass("fr-tag");
		expect(
			within(card("Indicateurs de représentation")).getByText(
				"Échéance au 15 octobre",
			),
		).toHaveClass("fr-tag");
	});

	it("states the thresholds from the domain rules", () => {
		renderSection();

		const remuneration = card("Indicateurs de rémunération");
		expect(
			within(remuneration).getByText("Dès 50 salariés"),
		).toBeInTheDocument();
		expect(
			within(remuneration).getByText(
				/^Les entreprises de 50 salariés ou plus doivent déclarer/,
			),
		).toBeInTheDocument();

		const representation = card("Indicateurs de représentation");
		expect(
			within(representation).getByText(`Dès 1${NNBSP}000 salariés`, {
				normalizer: (text) => text,
			}),
		).toBeInTheDocument();
		expect(
			within(representation).getByText(
				/d'au moins 1 000 salariés depuis 3 ans consécutifs/,
			),
		).toBeInTheDocument();
	});

	it("renders decorative illustrations", () => {
		renderSection();

		const images = screen.getAllByTestId("next-image");
		expect(images.map((image) => image.dataset.src)).toEqual([
			"/assets/images/home/remuneration-illustration.svg",
			"/assets/images/home/representation-illustration.svg",
		]);
		for (const image of images) {
			expect(image).toHaveAttribute("aria-label", "");
		}
	});
});
