import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	downloadCalls,
	failingFetch,
	getLiveRegion,
	pendingFetch,
	sizeProbeFetch,
} from "~/test/downloadHelpers";
import { DownloadCard, formatDocumentSubtitle } from "../DownloadCard";

const DATA_YEAR = 2024;
const DECLARATION_YEAR = 2025;
const HREF = "/api/cse-opinion-pdf?year=2025";
const DESCRIPTION = formatDocumentSubtitle(DECLARATION_YEAR, DATA_YEAR);

function renderCard() {
	return render(
		<DownloadCard
			description={DESCRIPTION}
			href={HREF}
			title="Télécharger l'avis du CSE"
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
		vi.stubGlobal("fetch", sizeProbeFetch(null));
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
	});

	it("shows the file size next to the format once the probe answers", async () => {
		vi.stubGlobal("fetch", sizeProbeFetch(63365));
		renderCard();

		expect(await screen.findByText("PDF – 61,88 Ko")).toBeInTheDocument();
	});

	it("probes the size of the very file the link points at", async () => {
		const fetchMock = sizeProbeFetch(63365);
		vi.stubGlobal("fetch", fetchMock);
		renderCard();

		await screen.findByText("PDF – 61,88 Ko");
		expect(fetchMock).toHaveBeenCalledWith(
			HREF,
			expect.objectContaining({ method: "HEAD" }),
		);
	});

	it("shows the format alone when the size cannot be known", async () => {
		vi.stubGlobal("fetch", sizeProbeFetch(null));
		renderCard();

		await act(async () => undefined);
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

		expect(downloadCalls(fetchMock)).toHaveLength(1);
	});

	it("leaves a modifier click to the browser's native behaviour", () => {
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		renderCard();

		const notPrevented = fireEvent.click(screen.getByRole("link"), {
			ctrlKey: true,
		});

		expect(notPrevented).toBe(true);
		expect(downloadCalls(fetchMock)).toHaveLength(0);
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
