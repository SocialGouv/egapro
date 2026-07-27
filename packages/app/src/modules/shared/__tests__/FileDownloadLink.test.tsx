import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	getLiveRegion,
	pdfResponse,
	pendingFetch,
} from "~/test/downloadHelpers";
import { FileDownloadLink } from "../FileDownloadLink";

const HREF = "/api/declaration-pdf";
const PENDING_LABEL = "Génération du récapitulatif en cours…";
const CHILDREN = "Télécharger le récapitulatif";

// Never lets a real navigation happen (jsdom logs "Not implemented: navigation")
// and lets us assert the programmatic download click.
let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	clickSpy = vi
		.spyOn(HTMLAnchorElement.prototype, "click")
		.mockImplementation(() => undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function renderLink(props: { pendingLabel?: string } = {}) {
	return render(
		<FileDownloadLink href={HREF} {...props}>
			{CHILDREN}
		</FileDownloadLink>,
	);
}

describe("FileDownloadLink", () => {
	it("renders the children as a link pointing at the real href", () => {
		renderLink();

		const link = screen.getByRole("link", { name: CHILDREN });
		expect(link).toHaveAttribute("href", HREF);
		expect(link).not.toHaveAttribute("aria-busy");
		expect(link).not.toHaveAttribute("aria-disabled");
	});

	it("keeps the caller's className alongside the guarded anchor props", () => {
		render(
			<FileDownloadLink className="fr-link fr-link--download" href={HREF}>
				{CHILDREN}
			</FileDownloadLink>,
		);

		const link = screen.getByRole("link");
		expect(link).toHaveClass("fr-link", "fr-link--download");
		expect(link).toHaveAttribute("href", HREF);
	});

	it("shows the pending label and sets aria-busy/aria-disabled while downloading", async () => {
		const user = userEvent.setup();
		let releaseFetch: (response: Response) => void = () => undefined;
		vi.stubGlobal(
			"fetch",
			vi.fn(
				() =>
					new Promise<Response>((resolve) => {
						releaseFetch = resolve;
					}),
			),
		);
		const { container } = renderLink({ pendingLabel: PENDING_LABEL });

		await user.click(screen.getByRole("link"));

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("aria-busy", "true");
		expect(link).toHaveAttribute("aria-disabled", "true");
		expect(link).toHaveTextContent(PENDING_LABEL);
		const announcement = getLiveRegion(container);
		expect(announcement).toHaveAttribute("aria-atomic", "true");
		expect(announcement).toHaveTextContent(PENDING_LABEL);

		await act(async () => {
			releaseFetch(pdfResponse());
		});
		await waitFor(() =>
			expect(screen.getByRole("link")).not.toHaveAttribute("aria-busy"),
		);
		expect(announcement).toBeEmptyDOMElement();
	});

	it("uses the default pending label when none is provided", async () => {
		const user = userEvent.setup();
		vi.stubGlobal("fetch", pendingFetch());
		renderLink();

		await user.click(screen.getByRole("link"));

		expect(screen.getByRole("link")).toHaveTextContent(
			"Téléchargement en cours…",
		);
	});

	it("does not trigger a second fetch when clicked again while pending", async () => {
		const user = userEvent.setup();
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		renderLink();

		const link = screen.getByRole("link");
		await user.click(link);
		await user.click(link);
		await user.click(link);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("triggers a single fetch for a burst of clicks fired before the re-render", async () => {
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		renderLink();

		const link = screen.getByRole("link");
		await act(async () => {
			for (let i = 0; i < 3; i++) {
				link.dispatchEvent(
					new MouseEvent("click", { bubbles: true, cancelable: true }),
				);
			}
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(HREF);
	});

	it("leaves a modifier click to the browser's native behaviour", () => {
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		renderLink();

		const notPrevented = fireEvent.click(screen.getByRole("link"), {
			metaKey: true,
		});

		expect(notPrevented).toBe(true);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(screen.getByRole("link")).not.toHaveAttribute("aria-busy");
	});

	it("invokes onBeforeDownload before starting the download", async () => {
		const user = userEvent.setup();
		const onBeforeDownload = vi.fn();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse())),
		);
		render(
			<FileDownloadLink href={HREF} onBeforeDownload={onBeforeDownload}>
				{CHILDREN}
			</FileDownloadLink>,
		);

		await user.click(screen.getByRole("link"));

		expect(onBeforeDownload).toHaveBeenCalledTimes(1);
	});

	it("renders an alert message when the download fails", async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse(undefined, { ok: false }))),
		);
		renderLink();

		await user.click(screen.getByRole("link"));

		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent("Le téléchargement a échoué, réessayez.");
	});

	it("clears the error and downloads again when the user retries", async () => {
		const user = userEvent.setup();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(pdfResponse(undefined, { ok: false }))
			.mockResolvedValueOnce(pdfResponse());
		vi.stubGlobal("fetch", fetchMock);
		renderLink();

		await user.click(screen.getByRole("link"));
		expect(await screen.findByRole("alert")).toBeInTheDocument();

		await user.click(screen.getByRole("link"));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
		expect(clickSpy).toHaveBeenCalledTimes(1);
	});
});
