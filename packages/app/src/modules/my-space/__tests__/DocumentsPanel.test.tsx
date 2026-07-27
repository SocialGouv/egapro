import { act, fireEvent, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getWorkforceYearFor } from "~/modules/domain";
import {
	DocumentsPanel,
	getDocumentResourceCount,
	getDocumentsPanelId,
} from "../DocumentsPanel";
import type { DeclarationItem } from "../types";

const DECLARATION_YEAR = 2026;
const SUBTITLE = `Année ${DECLARATION_YEAR} au titre des données ${getWorkforceYearFor(DECLARATION_YEAR)}`;

const PREFILL_TITLE =
	"Télécharger les données préremplies (issues des données DSN)";
const RECAP_TITLE =
	"Télécharger le récapitulatif de la déclaration des indicateurs";
const TRANSMITTED_TITLE = "Télécharger le récapitulatif des éléments transmis";
const SECOND_TITLE = "Télécharger le récapitulatif de la seconde déclaration";

function makeDeclaration(
	overrides: Partial<DeclarationItem> = {},
): DeclarationItem {
	return {
		type: "remuneration",
		siren: "123456789",
		year: DECLARATION_YEAR,
		status: "done",
		fsmStatus: null,
		currentStep: 5,
		updatedAt: null,
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: false,
		hasSubmittedCseOpinion: false,
		cseRequired: false,
		hasJointEvaluationFile: false,
		hasPrefillData: false,
		...overrides,
	};
}

function pendingFetch() {
	return vi.fn(() => new Promise<Response>(() => undefined));
}

function failingFetch() {
	return vi.fn(() =>
		Promise.resolve({
			ok: false,
			blob: () => Promise.resolve(new Blob(["pdf"])),
			headers: { get: () => null },
		} as unknown as Response),
	);
}

// The panel is a closed <dialog>, so its subtree is display:none and role
// queries must opt into hidden elements.
function renderPanel(overrides: Partial<DeclarationItem> = {}) {
	const { container } = render(
		<DocumentsPanel declaration={makeDeclaration(overrides)} />,
	);
	const dialog = container.querySelector("dialog") as HTMLElement;
	return {
		container,
		dialog,
		panel: within(dialog),
		links: () =>
			within(dialog).queryAllByRole("link", {
				hidden: true,
			}) as HTMLAnchorElement[],
	};
}

beforeEach(() => {
	vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
		() => undefined,
	);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("getDocumentsPanelId", () => {
	it("builds an id scoped to the declaration type and year", () => {
		expect(getDocumentsPanelId(makeDeclaration())).toBe(
			`documents-panel-remuneration-${DECLARATION_YEAR}`,
		);
		expect(
			getDocumentsPanelId(makeDeclaration({ type: "representation" })),
		).toBe(`documents-panel-representation-${DECLARATION_YEAR}`);
	});
});

describe("getDocumentResourceCount", () => {
	it("counts no resource for a representation declaration", () => {
		expect(
			getDocumentResourceCount(
				makeDeclaration({ type: "representation", hasPrefillData: true }),
			),
		).toBe(0);
	});

	it("counts no resource for a remuneration declaration still in progress", () => {
		expect(
			getDocumentResourceCount(makeDeclaration({ status: "in_progress" })),
		).toBe(0);
	});

	it("counts the prefill resource as soon as DSN data exists", () => {
		expect(
			getDocumentResourceCount(
				makeDeclaration({ status: "in_progress", hasPrefillData: true }),
			),
		).toBe(1);
	});

	it("counts the recap and transmitted resources once the declaration is done", () => {
		expect(getDocumentResourceCount(makeDeclaration())).toBe(2);
	});

	it("counts every resource when the second declaration was submitted", () => {
		expect(
			getDocumentResourceCount(
				makeDeclaration({
					hasPrefillData: true,
					hasSubmittedSecondDeclaration: true,
				}),
			),
		).toBe(4);
	});
});

describe("DocumentsPanel", () => {
	it("labels the panel with the remuneration process title", () => {
		const { dialog, panel } = renderPanel();

		expect(dialog).toHaveAttribute(
			"id",
			`documents-panel-remuneration-${DECLARATION_YEAR}`,
		);
		expect(dialog).toHaveAttribute(
			"aria-labelledby",
			`documents-panel-remuneration-${DECLARATION_YEAR}-title`,
		);
		expect(
			panel.getByText(
				`Démarche des indicateurs de rémunération ${DECLARATION_YEAR}`,
			),
		).toHaveAttribute(
			"id",
			`documents-panel-remuneration-${DECLARATION_YEAR}-title`,
		);
	});

	it("labels the panel with the representation process title and offers no document", () => {
		const { panel, links } = renderPanel({ type: "representation" });

		expect(
			panel.getByText(`Démarche de représentation ${DECLARATION_YEAR}`),
		).toBeInTheDocument();
		expect(links()).toHaveLength(0);
	});

	it("renders one card per available resource, in order", () => {
		const { links } = renderPanel({
			hasPrefillData: true,
			hasSubmittedSecondDeclaration: true,
		});

		expect(links().map((link) => link.textContent)).toEqual([
			PREFILL_TITLE,
			RECAP_TITLE,
			TRANSMITTED_TITLE,
			SECOND_TITLE,
		]);
	});

	it("points each card at its own PDF route and dates it with the workforce year", () => {
		const { panel, links } = renderPanel({
			hasPrefillData: true,
			hasSubmittedSecondDeclaration: true,
		});

		expect(links().map((link) => link.getAttribute("href"))).toEqual([
			`/api/prefill-pdf?year=${DECLARATION_YEAR}`,
			`/api/declaration-pdf?year=${DECLARATION_YEAR}`,
			`/api/transmitted-pdf?year=${DECLARATION_YEAR}`,
			`/api/declaration-pdf?type=correction&year=${DECLARATION_YEAR}`,
		]);
		expect(panel.getAllByText(SUBTITLE)).toHaveLength(4);
		expect(panel.getAllByText("PDF")).toHaveLength(4);
	});

	it("omits the prefill card when no DSN data is available", () => {
		const { links } = renderPanel();

		expect(links().map((link) => link.textContent)).toEqual([
			RECAP_TITLE,
			TRANSMITTED_TITLE,
		]);
	});

	it("omits the recap cards while the declaration is not done", () => {
		const { links } = renderPanel({
			status: "in_progress",
			hasPrefillData: true,
		});

		expect(links().map((link) => link.textContent)).toEqual([PREFILL_TITLE]);
	});

	it("triggers a single fetch for a burst of clicks fired before the re-render", async () => {
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		const { links } = renderPanel();

		const [link] = links();
		await act(async () => {
			link?.dispatchEvent(
				new MouseEvent("click", { bubbles: true, cancelable: true }),
			);
			link?.dispatchEvent(
				new MouseEvent("click", { bubbles: true, cancelable: true }),
			);
			link?.dispatchEvent(
				new MouseEvent("click", { bubbles: true, cancelable: true }),
			);
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			`/api/declaration-pdf?year=${DECLARATION_YEAR}`,
		);
	});

	it("leaves a modifier click to the browser's native behaviour", () => {
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		const { links } = renderPanel();

		const [link] = links();
		const notPrevented = fireEvent.click(link as HTMLAnchorElement, {
			metaKey: true,
		});

		expect(notPrevented).toBe(true);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(links()[0]).not.toHaveAttribute("aria-busy");
	});

	it("announces the pending state and marks the card busy while downloading", () => {
		vi.stubGlobal("fetch", pendingFetch());
		const { dialog, panel, links } = renderPanel();

		fireEvent.click(links()[0] as HTMLAnchorElement);

		const link = links()[0];
		expect(link).toHaveAttribute("aria-busy", "true");
		expect(link).toHaveAttribute("aria-disabled", "true");
		const announcement = dialog.querySelector('[aria-live="polite"]');
		expect(announcement).toHaveAttribute("aria-atomic", "true");
		expect(announcement).toHaveTextContent("Téléchargement en cours…");
		expect(panel.getAllByText("Téléchargement en cours…")).toHaveLength(2);
		expect(panel.getAllByText("PDF")).toHaveLength(1);
	});

	it("keeps each card's download state independent", () => {
		vi.stubGlobal("fetch", pendingFetch());
		const { links } = renderPanel();

		fireEvent.click(links()[0] as HTMLAnchorElement);

		expect(links()[0]).toHaveAttribute("aria-busy", "true");
		expect(links()[1]).not.toHaveAttribute("aria-busy");
	});

	it("renders an alert message when the download fails", async () => {
		vi.stubGlobal("fetch", failingFetch());
		const { panel, links } = renderPanel();

		fireEvent.click(links()[0] as HTMLAnchorElement);

		const alert = await panel.findByRole("alert", { hidden: true });
		expect(alert).toHaveTextContent("Le téléchargement a échoué, réessayez.");
	});

	it("accepts a new download after a failed attempt", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({
				ok: false,
				blob: () => Promise.resolve(new Blob(["pdf"])),
				headers: { get: () => null },
			} as unknown as Response)
			.mockResolvedValueOnce({
				ok: true,
				blob: () => Promise.resolve(new Blob(["pdf"])),
				headers: { get: () => null },
			} as unknown as Response);
		vi.stubGlobal("fetch", fetchMock);
		const { panel, links } = renderPanel();

		fireEvent.click(links()[0] as HTMLAnchorElement);
		expect(
			await panel.findByRole("alert", { hidden: true }),
		).toBeInTheDocument();

		await act(async () => {
			links()[0]?.dispatchEvent(
				new MouseEvent("click", { bubbles: true, cancelable: true }),
			);
		});

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(
			panel.queryByRole("alert", { hidden: true }),
		).not.toBeInTheDocument();
	});
});
