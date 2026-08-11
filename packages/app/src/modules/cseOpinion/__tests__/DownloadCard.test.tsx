import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	failingFetch,
	getLiveRegion,
	pendingFetch,
} from "~/test/downloadHelpers";
import { DownloadCard } from "../DownloadCard";

const DATA_YEAR = 2024;
const DECLARATION_YEAR = 2025;
const HREF = "/api/cse-opinion-pdf?year=2025";

function renderCard() {
	return render(
		<DownloadCard
			dataYear={DATA_YEAR}
			href={HREF}
			title="Télécharger l'avis du CSE"
			year={DECLARATION_YEAR}
		/>,
	);
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

describe("DownloadCard", () => {
	it("names the file in a heading link and its years alongside", () => {
		renderCard();

		// DSFR download card: the link carries the title only, and the enlarged
		// click zone is drawn over the whole card in CSS.
		const link = screen.getByRole("link", {
			name: "Télécharger l'avis du CSE",
		});
		expect(link).toHaveAttribute("href", HREF);
		expect(link).toHaveAttribute("download");
		expect(link).not.toHaveAttribute("aria-busy");
		expect(link).not.toHaveAttribute("aria-disabled");

		expect(
			screen.getByRole("heading", { name: "Télécharger l'avis du CSE" }),
		).toContainElement(link);
		expect(
			screen.getByText(
				`Année ${DECLARATION_YEAR} au titre des données ${DATA_YEAR}`,
			),
		).toBeInTheDocument();
		expect(screen.getByText("PDF")).toBeInTheDocument();
	});

	it("announces the pending state and marks the link busy while downloading", async () => {
		const user = userEvent.setup();
		vi.stubGlobal("fetch", pendingFetch());
		const { container } = renderCard();

		await user.click(screen.getByRole("link"));

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("aria-busy", "true");
		expect(link).toHaveAttribute("aria-disabled", "true");
		expect(link).toHaveTextContent("Téléchargement en cours…");
		const announcement = getLiveRegion(container);
		expect(announcement).toHaveAttribute("aria-atomic", "true");
		expect(announcement).toHaveTextContent("Téléchargement en cours…");
	});

	it("triggers a single fetch for a burst of clicks fired before the re-render", async () => {
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		renderCard();

		const link = screen.getByRole("link");
		await act(async () => {
			link.dispatchEvent(
				new MouseEvent("click", { bubbles: true, cancelable: true }),
			);
			link.dispatchEvent(
				new MouseEvent("click", { bubbles: true, cancelable: true }),
			);
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("leaves a modifier click to the browser's native behaviour", () => {
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		renderCard();

		const notPrevented = fireEvent.click(screen.getByRole("link"), {
			ctrlKey: true,
		});

		expect(notPrevented).toBe(true);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(screen.getByRole("link")).not.toHaveAttribute("aria-busy");
	});

	it("renders an alert message when the download fails", async () => {
		const user = userEvent.setup();
		vi.stubGlobal("fetch", failingFetch());
		renderCard();

		await user.click(screen.getByRole("link"));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Le téléchargement a échoué, réessayez.",
		);
	});
});
