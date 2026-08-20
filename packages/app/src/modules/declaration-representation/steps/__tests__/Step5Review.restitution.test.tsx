import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/modules/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("~/modules/shared")>()),
	useDsfrModal: () => ({
		modalRef: { current: null },
		open: vi.fn(),
		close: vi.fn(),
	}),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		representationDeclaration: {
			submit: {
				useMutation: () => ({
					error: null,
					isPending: false,
					mutate: vi.fn(),
				}),
			},
		},
	},
}));

import {
	COMPUTABLE_MEMBERS,
	NO_EXECUTIVES,
	NON_COMPLIANT_EXECUTIVES,
	NON_COMPLIANT_MEMBERS,
	OFFLINE_PUBLICATION,
	REPRESENTATION_YEAR,
	SINGLE_EXECUTIVE,
	WEBSITE_PUBLICATION,
} from "~/modules/declaration-representation/__tests__/fixtures";
import {
	EXECUTIVES_TITLE,
	MEMBERS_TITLE,
} from "~/modules/declaration-representation/shared/reviewSummary";
import {
	BOTH_COMPUTABLE,
	FULLY_COMPLIANT,
	NOTHING_COMPUTABLE,
	renderReview,
	SINGLE_GAP,
} from "./step5ReviewHarness";

const TELEACCORDS_URL = "https://www.teleaccords.travail.gouv.fr";

function definitionValue(term: string): string {
	const value = screen.getByText(term, { selector: "dt" }).nextElementSibling;
	return value?.textContent ?? "";
}

function indicatorCard(title: string): HTMLElement {
	const heading = screen.getByRole("heading", { level: 3, name: title });
	const card = heading.parentElement;
	if (card === null) throw new Error(`Missing card for "${title}".`);
	return card;
}

function nextStepsSection(): HTMLElement {
	const heading = screen.getByRole("heading", {
		level: 2,
		name: "Prochaines étapes",
	});
	const section = heading.closest("section");
	if (section === null) throw new Error("Missing next-steps section.");
	return section;
}

function complianceBadges() {
	return screen.queryAllByText(/^(Conforme|Non conforme|Non applicable)$/, {
		selector: "p.fr-badge",
	});
}

describe("Step5Review — restitution du brouillon (S18)", () => {
	it("restitutes the reference year and period", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		expect(definitionValue("Année de référence")).toBe(
			String(REPRESENTATION_YEAR),
		);
		expect(definitionValue("Période de référence")).toBe(
			"01/01/2025 - 31/12/2025",
		);
	});

	it("marks an unknown reference period with a dash", () => {
		renderReview({
			draft: {
				...FULLY_COMPLIANT,
				referencePeriodStart: undefined,
				referencePeriodEnd: undefined,
			},
		});

		expect(definitionValue("Période de référence")).toBe("— - —");
	});

	it("restitutes both computable gaps", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		const executives = within(indicatorCard(EXECUTIVES_TITLE));
		expect(executives.getByText("Femmes").nextElementSibling).toHaveTextContent(
			"60 %",
		);
		expect(executives.getByText("Hommes").nextElementSibling).toHaveTextContent(
			"40 %",
		);

		const members = within(indicatorCard(MEMBERS_TITLE));
		expect(members.getByText("Femmes").nextElementSibling).toHaveTextContent(
			"55 %",
		);
		expect(members.getByText("Hommes").nextElementSibling).toHaveTextContent(
			"45 %",
		);
	});

	it("restitutes a website publication", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		expect(definitionValue("Date de publication")).toBe("01/03/2026");
		expect(definitionValue("Site Internet de publication")).toBe("Oui");
		const publicationLink = screen.getByRole("link", {
			name: new RegExp(
				`${WEBSITE_PUBLICATION.publishUrl}.*nouvelle fenêtre`,
				"i",
			),
		});
		expect(publicationLink).toHaveAttribute(
			"href",
			WEBSITE_PUBLICATION.publishUrl,
		);
		expect(publicationLink).toHaveAttribute("target", "_blank");
		expect(publicationLink).toHaveAttribute("rel", "noopener noreferrer");
		expect(
			screen.queryByText("Modalités de communication", { selector: "dt" }),
		).not.toBeInTheDocument();
	});

	it("prefixes a protocol-less publication URL so the link is navigable", () => {
		renderReview({
			draft: {
				...BOTH_COMPUTABLE,
				hasWebsite: true,
				publishUrl: "www.exemple.fr/egalite",
			},
		});

		expect(
			screen.getByRole("link", {
				name: /www\.exemple\.fr\/egalite.*nouvelle fenêtre/i,
			}),
		).toHaveAttribute("href", "https://www.exemple.fr/egalite");
	});

	it("restitutes an offline publication", () => {
		renderReview({ draft: { ...BOTH_COMPUTABLE, ...OFFLINE_PUBLICATION } });

		expect(definitionValue("Site Internet de publication")).toBe("Non");
		expect(definitionValue("Modalités de communication")).toBe(
			OFFLINE_PUBLICATION.publishModalities,
		);
		expect(
			screen.queryByText("Adresse de la page (URL)", { selector: "dt" }),
		).not.toBeInTheDocument();
	});

	it("marks the publication details left blank with a dash", () => {
		renderReview({ draft: { ...BOTH_COMPUTABLE, hasWebsite: true } });

		expect(definitionValue("Date de publication")).toBe("—");
		expect(definitionValue("Adresse de la page (URL)")).toBe("—");
	});

	it("marks blank communication modalities with a dash", () => {
		renderReview({ draft: { ...BOTH_COMPUTABLE, hasWebsite: false } });

		expect(definitionValue("Modalités de communication")).toBe("—");
	});
});

describe("Step5Review — verdicts par indicateur (S16)", () => {
	it("badges each indicator on its own, with no global verdict", () => {
		renderReview({ draft: SINGLE_GAP });

		expect(indicatorCard(EXECUTIVES_TITLE)).toHaveTextContent("Conforme");
		expect(indicatorCard(EXECUTIVES_TITLE)).not.toHaveTextContent(
			"Non conforme",
		);
		expect(indicatorCard(MEMBERS_TITLE)).toHaveTextContent("Non conforme");
		expect(complianceBadges()).toHaveLength(2);
	});

	it("badges a computable gap left unfilled as not applicable", () => {
		renderReview({
			draft: { executivesCount: "two_or_more", ...COMPUTABLE_MEMBERS },
		});

		const executives = within(indicatorCard(EXECUTIVES_TITLE));
		expect(executives.getByText("Femmes").nextElementSibling).toHaveTextContent(
			"—",
		);
		expect(indicatorCard(EXECUTIVES_TITLE)).toHaveTextContent("Non applicable");
	});
});

describe("Step5Review — écarts non calculables (S12)", () => {
	it("shows both reasons, no publication block and no next steps", () => {
		renderReview({ draft: { ...NOTHING_COMPUTABLE, ...WEBSITE_PUBLICATION } });

		expect(indicatorCard(EXECUTIVES_TITLE)).toHaveTextContent(
			"Aucun cadre dirigeant",
		);
		expect(indicatorCard(MEMBERS_TITLE)).toHaveTextContent(
			"Aucune instance dirigeante",
		);
		expect(complianceBadges()).toHaveLength(2);
		expect(indicatorCard(EXECUTIVES_TITLE)).toHaveTextContent("Non applicable");
		expect(indicatorCard(MEMBERS_TITLE)).toHaveTextContent("Non applicable");
		expect(
			screen.queryByRole("heading", { name: "Publication" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Prochaines étapes" }),
		).not.toBeInTheDocument();
	});

	it("tells the modal that nothing is computable", () => {
		renderReview({ draft: NOTHING_COMPUTABLE });

		expect(
			screen.getByText(/Vos écarts de représentation ne sont pas calculables/),
		).toBeInTheDocument();
	});

	it("shows the single-executive reason", () => {
		renderReview({ draft: { ...SINGLE_EXECUTIVE, ...COMPUTABLE_MEMBERS } });

		expect(indicatorCard(EXECUTIVES_TITLE)).toHaveTextContent(
			"Un cadre dirigeant",
		);
	});

	it("keeps the publication block as soon as one gap is computable", () => {
		renderReview({
			draft: {
				...NO_EXECUTIVES,
				...COMPUTABLE_MEMBERS,
				...WEBSITE_PUBLICATION,
			},
		});

		expect(
			screen.getByRole("heading", { name: "Publication" }),
		).toBeInTheDocument();
	});
});

describe("Step5Review — prochaines étapes (S17)", () => {
	it("names the failing indicator and both correction routes", () => {
		renderReview({ draft: SINGLE_GAP });

		const section = within(nextStepsSection());
		expect(
			section.getByText(
				/Vous n'êtes pas conforme concernant l'écart relatif aux membres des instances dirigeantes/,
			),
		).toBeInTheDocument();
		expect(
			section.getByText(
				"Par accord collectif, dans le cadre de la négociation obligatoire sur l'égalité professionnelle",
			),
		).toBeInTheDocument();
		expect(
			section.getByText(
				"Par décision unilatérale de l'employeur après information - consultation du CSE",
			),
		).toBeInTheDocument();
	});

	it("names both indicators when the two gaps fail", () => {
		renderReview({
			draft: {
				...NON_COMPLIANT_EXECUTIVES,
				...NON_COMPLIANT_MEMBERS,
				...WEBSITE_PUBLICATION,
			},
		});

		expect(
			within(nextStepsSection()).getByText(
				/les écarts relatifs aux cadres dirigeants et aux membres des instances dirigeantes/,
			),
		).toBeInTheDocument();
	});

	it("points the deposit at TéléAccords in a new tab", () => {
		renderReview({ draft: SINGLE_GAP });

		const link = within(nextStepsSection()).getByRole("link", {
			name: /TéléAccords.*nouvelle fenêtre/i,
		});

		expect(link).toHaveAttribute("href", TELEACCORDS_URL);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("stays a read-only notice, with no field and no upload", () => {
		renderReview({ draft: SINGLE_GAP });

		expect(
			nextStepsSection().querySelectorAll(
				"input, textarea, select, button, [contenteditable]",
			),
		).toHaveLength(0);
	});

	it("stays hidden while every computable gap is compliant", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		expect(
			screen.queryByRole("heading", { name: "Prochaines étapes" }),
		).not.toBeInTheDocument();
	});
});
