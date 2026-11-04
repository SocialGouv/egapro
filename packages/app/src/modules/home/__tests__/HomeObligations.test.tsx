import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkforceObligations } from "~/modules/domain";

const { obligationsOverride } = vi.hoisted(() => ({
	obligationsOverride: { current: null as WorkforceObligations | null },
}));

vi.mock("~/modules/domain", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/domain")>();
	return {
		...actual,
		getWorkforceObligations: (
			bracket: Parameters<typeof actual.getWorkforceObligations>[0],
		) => obligationsOverride.current ?? actual.getWorkforceObligations(bracket),
	};
});

import { HomeObligations } from "../HomeObligations";

afterEach(() => {
	obligationsOverride.current = null;
});

const NNBSP = " ";
const BRACKET_LABELS = [
	"Moins de 50 salariés",
	"50 à 99 salariés",
	"100 à 149 salariés",
	"150 à 249 salariés",
	"250 à 999 salariés",
	`1${NNBSP}000 salariés et plus`,
];

function tag(name: string) {
	return screen.getByRole("button", { name });
}

function obligations() {
	const tags = new Set(
		within(
			screen.getByRole("list", {
				name: "Combien de salariés compte votre entreprise ?",
			}),
		).getAllByRole("listitem"),
	);
	return screen
		.getAllByRole("listitem")
		.filter((item) => !tags.has(item))
		.map((item) => item.textContent);
}

describe("HomeObligations", () => {
	it("renders the section heading and the checker title", () => {
		render(<HomeObligations />);

		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Que devez-vous déclarer ?",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: "Vérifier mes obligations",
			}),
		).toBeInTheDocument();
	});

	it("renders the six bracket tags unpressed, named by the question, with no obligation list", () => {
		render(<HomeObligations />);

		const group = screen.getByRole("list", {
			name: "Combien de salariés compte votre entreprise ?",
		});
		const tags = within(group).getAllByRole("button");
		expect(tags.map((button) => button.textContent)).toEqual(BRACKET_LABELS);
		for (const button of tags) {
			expect(button).toHaveAttribute("aria-pressed", "false");
			expect(button).toHaveClass("fr-tag");
		}
		expect(
			screen.queryByText("Ce que vous devez faire"),
		).not.toBeInTheDocument();
	});

	it("presses 50 à 99 and lists its two obligations with the detail link", async () => {
		const user = userEvent.setup();
		render(<HomeObligations />);

		await user.click(tag("50 à 99 salariés"));

		expect(tag("50 à 99 salariés")).toHaveAttribute("aria-pressed", "true");
		expect(
			screen.getByRole("heading", {
				level: 4,
				name: "Ce que vous devez faire",
			}),
		).toBeInTheDocument();
		expect(obligations()).toEqual([
			"Déclarer les indicateurs de rémunération préremplis pour l'ensemble des salariésTous les ans, à partir de 2027",
			"Déclarer l'indicateur de rémunération par catégorie d'emploisTous les 3 ans, à partir de 2030",
		]);
		expect(
			screen.getByRole("link", { name: "Voir le détail de mes obligations" }),
		).toHaveAttribute("href", "/en-construction");
	});

	it("moves the selection to 150 à 249 and lists the CSE opinion", async () => {
		const user = userEvent.setup();
		render(<HomeObligations />);

		await user.click(tag("50 à 99 salariés"));
		await user.click(tag("150 à 249 salariés"));

		expect(tag("50 à 99 salariés")).toHaveAttribute("aria-pressed", "false");
		expect(tag("150 à 249 salariés")).toHaveAttribute("aria-pressed", "true");
		expect(obligations()).toEqual([
			"Déclarer les indicateurs de rémunération préremplis pour l'ensemble des salariésTous les ans, à partir de 2027",
			"Déclarer l'indicateur de rémunération par catégorie d'emploisTous les 3 ans, à partir de 2027",
			"Transmettre l'avis ou les avis du CSE à votre démarche",
		]);
	});

	it("releases the active tag on a second click and hides the list", async () => {
		const user = userEvent.setup();
		render(<HomeObligations />);

		await user.click(tag("150 à 249 salariés"));
		await user.click(tag("150 à 249 salariés"));

		for (const label of BRACKET_LABELS) {
			expect(tag(label)).toHaveAttribute("aria-pressed", "false");
		}
		expect(
			screen.queryByText("Ce que vous devez faire"),
		).not.toBeInTheDocument();
	});

	it("shows only the voluntary sentence below 50 employees", async () => {
		const user = userEvent.setup();
		render(<HomeObligations />);

		await user.click(tag("Moins de 50 salariés"));

		expect(
			screen.getByText(
				"Aucune obligation, déclaration facultative des indicateurs de rémunération",
			).tagName,
		).toBe("STRONG");
		expect(
			screen.queryByText("Ce que vous devez faire"),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("adds the yearly representation obligation and its subjection mention from 1 000 employees", async () => {
		const user = userEvent.setup();
		render(<HomeObligations />);

		await user.click(tag(`1${NNBSP}000 salariés et plus`));

		expect(obligations()).toEqual([
			"Déclarer les indicateurs de rémunération préremplis pour l'ensemble des salariésTous les ans, à partir de 2027",
			"Déclarer l'indicateur de rémunération par catégorie d'emploisTous les ans, à partir de 2027",
			"Transmettre l'avis ou les avis du CSE à votre démarche",
			"Déclarer les indicateurs de représentation dans les postes de directionTous les ans",
		]);
		expect(
			screen.getByText(
				"Si vous comptez au moins 1 000 salariés depuis 3 exercices consécutifs.",
			),
		).toHaveClass("fr-text-mention--grey");
		expect(screen.getAllByText(/^Tous les/)[0]).toHaveClass(
			"fr-text-mention--grey",
		);
	});

	it("offers a keyboard-reachable help button describing the workforce basis", async () => {
		const user = userEvent.setup();
		render(<HomeObligations />);

		await user.tab();

		const help = screen.getByRole("button", {
			name: "Information sur l'effectif pris en compte",
		});
		expect(help).toHaveFocus();
		expect(help).toHaveAccessibleDescription(
			"L'assujettissement se base sur l'effectif annuel moyen.",
		);
	});

	it("omits the category indicator when the rules give it no cadence", async () => {
		obligationsOverride.current = {
			mandatory: true,
			prefilledIndicators: { fromYear: 2027, everyYears: 1 },
			categoryIndicator: null,
			cseOpinion: false,
			representation: null,
		};
		const user = userEvent.setup();
		render(<HomeObligations />);

		await user.click(tag("50 à 99 salariés"));

		expect(obligations()).toEqual([
			"Déclarer les indicateurs de rémunération préremplis pour l'ensemble des salariésTous les ans, à partir de 2027",
		]);
	});
});
