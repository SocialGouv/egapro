import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MouseEvent } from "react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";

import {
	FileDownloadLink,
	isNativeClick,
	useFileDownload,
} from "../FileDownloadLink";

const createObjectURLMock = URL.createObjectURL as unknown as Mock;
const revokeObjectURLMock = URL.revokeObjectURL as unknown as Mock;

const NATIVE_CLICK_MODIFIERS = [
	"altKey",
	"ctrlKey",
	"metaKey",
	"shiftKey",
] as const;

function pdfResponse(
	disposition?: string,
	{ ok = true }: { ok?: boolean } = {},
): Response {
	return {
		ok,
		blob: () => Promise.resolve(new Blob(["pdf"], { type: "application/pdf" })),
		headers: {
			get: (name: string) =>
				name.toLowerCase() === "content-disposition"
					? (disposition ?? null)
					: null,
		},
	} as unknown as Response;
}

function mouseEvent(
	modifier?: (typeof NATIVE_CLICK_MODIFIERS)[number],
): MouseEvent {
	return {
		altKey: false,
		ctrlKey: false,
		metaKey: false,
		shiftKey: false,
		...(modifier ? { [modifier]: true } : {}),
	} as unknown as MouseEvent;
}

function pendingFetch(): Mock {
	return vi.fn(() => new Promise<Response>(() => undefined));
}

// Never lets a real navigation happen (jsdom logs "Not implemented: navigation")
// and lets us assert the programmatic download click.
let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	createObjectURLMock.mockClear();
	revokeObjectURLMock.mockClear();
	clickSpy = vi
		.spyOn(HTMLAnchorElement.prototype, "click")
		.mockImplementation(() => undefined);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("isNativeClick", () => {
	it.each(NATIVE_CLICK_MODIFIERS)("detects a %s click", (modifier) => {
		expect(isNativeClick(mouseEvent(modifier))).toBe(true);
	});

	it("does not detect a plain click", () => {
		expect(isNativeClick(mouseEvent())).toBe(false);
	});
});

describe("useFileDownload", () => {
	it("fetches the blob, triggers a programmatic download and returns to idle", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve(pdfResponse('attachment; filename="recap.pdf"')),
			),
		);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(fetch).toHaveBeenCalledWith("/api/declaration-pdf");
		expect(createObjectURLMock).toHaveBeenCalledTimes(1);
		expect(clickSpy).toHaveBeenCalledTimes(1);
		expect(result.current.state).toBe("idle");
	});

	it("keeps the object URL alive once the click is handed over to the browser", async () => {
		vi.useFakeTimers();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse())),
		);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(clickSpy).toHaveBeenCalledTimes(1);
		expect(revokeObjectURLMock).not.toHaveBeenCalled();
	});

	it("revokes the object URL once the retention delay has elapsed", async () => {
		vi.useFakeTimers();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse())),
		);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});
		act(() => {
			vi.runAllTimers();
		});

		expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
		expect(revokeObjectURLMock).toHaveBeenCalledWith(
			createObjectURLMock.mock.results[0]?.value,
		);
	});

	it("attaches the programmatic anchor to the document and detaches it after the click", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse())),
		);
		const { result } = renderHook(() => useFileDownload());
		const anchor = document.createElement("a");
		const createElementSpy = vi
			.spyOn(document, "createElement")
			.mockReturnValue(anchor);
		let connectedDuringClick: boolean | undefined;
		clickSpy.mockImplementation(() => {
			connectedDuringClick = anchor.isConnected;
		});

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});
		createElementSpy.mockRestore();

		expect(connectedDuringClick).toBe(true);
		expect(anchor.isConnected).toBe(false);
	});

	it("ignores a burst of calls fired before the pending state is committed", async () => {
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		const { result } = renderHook(() => useFileDownload());
		const { download } = result.current;

		await act(async () => {
			void download("/api/declaration-pdf");
			void download("/api/declaration-pdf");
			void download("/api/declaration-pdf");
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("ignores a second call while a download is pending", async () => {
		let releaseFetch: (response: Response) => void = () => undefined;
		const fetchMock = vi.fn(
			() =>
				new Promise<Response>((resolve) => {
					releaseFetch = resolve;
				}),
		);
		vi.stubGlobal("fetch", fetchMock);
		const { result } = renderHook(() => useFileDownload());

		let firstCall: Promise<void> = Promise.resolve();
		act(() => {
			firstCall = result.current.download("/api/declaration-pdf");
		});
		expect(result.current.state).toBe("pending");

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);

		await act(async () => {
			releaseFetch(pdfResponse());
			await firstCall;
		});
		expect(result.current.state).toBe("idle");
	});

	it("sets error state when the response is not ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse(undefined, { ok: false }))),
		);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(result.current.state).toBe("error");
		expect(clickSpy).not.toHaveBeenCalled();
		expect(createObjectURLMock).not.toHaveBeenCalled();
	});

	it("sets error state when fetch rejects", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.reject(new Error("network down"))),
		);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(result.current.state).toBe("error");
	});

	it("accepts a new download after a failed response", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(pdfResponse(undefined, { ok: false }))
			.mockResolvedValueOnce(pdfResponse());
		vi.stubGlobal("fetch", fetchMock);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});
		expect(result.current.state).toBe("error");

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(result.current.state).toBe("idle");
	});

	it("accepts a new download after fetch rejected", async () => {
		const fetchMock = vi
			.fn()
			.mockRejectedValueOnce(new Error("network down"))
			.mockResolvedValueOnce(pdfResponse());
		vi.stubGlobal("fetch", fetchMock);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});
		expect(result.current.state).toBe("error");

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(result.current.state).toBe("idle");
	});

	it("extracts the filename from an ASCII Content-Disposition header", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve(pdfResponse('attachment; filename="recap-2026.pdf"')),
			),
		);
		const anchor = document.createElement("a");
		const createElementSpy = vi
			.spyOn(document, "createElement")
			.mockReturnValue(anchor);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(anchor.download).toBe("recap-2026.pdf");
		createElementSpy.mockRestore();
	});

	it("prefers the UTF-8 Content-Disposition filename and decodes it", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve(
					pdfResponse(
						"attachment; filename=\"fallback.pdf\"; filename*=UTF-8''r%C3%A9capitulatif.pdf",
					),
				),
			),
		);
		const anchor = document.createElement("a");
		const createElementSpy = vi
			.spyOn(document, "createElement")
			.mockReturnValue(anchor);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(anchor.download).toBe("récapitulatif.pdf");
		createElementSpy.mockRestore();
	});

	it("leaves the download attribute unset when no filename can be parsed", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse("attachment"))),
		);
		const anchor = document.createElement("a");
		const createElementSpy = vi
			.spyOn(document, "createElement")
			.mockReturnValue(anchor);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(anchor.download).toBe("");
		createElementSpy.mockRestore();
	});

	it("leaves the download attribute unset when the header is absent", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse())),
		);
		const anchor = document.createElement("a");
		const createElementSpy = vi
			.spyOn(document, "createElement")
			.mockReturnValue(anchor);
		const { result } = renderHook(() => useFileDownload());

		await act(async () => {
			await result.current.download("/api/declaration-pdf");
		});

		expect(anchor.download).toBe("");
		createElementSpy.mockRestore();
	});
});

describe("FileDownloadLink", () => {
	it("renders the children as a link pointing at the real href", () => {
		render(
			<FileDownloadLink href="/api/declaration-pdf">
				Télécharger le récapitulatif
			</FileDownloadLink>,
		);

		const link = screen.getByRole("link", {
			name: "Télécharger le récapitulatif",
		});
		expect(link).toHaveAttribute("href", "/api/declaration-pdf");
		expect(link).not.toHaveAttribute("aria-busy");
		expect(link).not.toHaveAttribute("aria-disabled");
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
		const { container } = render(
			<FileDownloadLink
				href="/api/declaration-pdf"
				pendingLabel="Génération du récapitulatif en cours…"
			>
				Télécharger le récapitulatif
			</FileDownloadLink>,
		);

		await user.click(screen.getByRole("link"));

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("aria-busy", "true");
		expect(link).toHaveAttribute("aria-disabled", "true");
		expect(link).toHaveTextContent("Génération du récapitulatif en cours…");
		const announcement = container.querySelector('[aria-live="polite"]');
		expect(announcement).toHaveAttribute("aria-atomic", "true");
		expect(announcement).toHaveTextContent(
			"Génération du récapitulatif en cours…",
		);

		await act(async () => {
			releaseFetch(pdfResponse());
		});
		await waitFor(() =>
			expect(screen.getByRole("link")).not.toHaveAttribute("aria-busy"),
		);
		expect(announcement).toBeEmptyDOMElement();
	});

	it("does not trigger a second fetch when clicked again while pending", async () => {
		const user = userEvent.setup();
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		render(
			<FileDownloadLink href="/api/declaration-pdf">
				Télécharger le récapitulatif
			</FileDownloadLink>,
		);

		const link = screen.getByRole("link");
		await user.click(link);
		await user.click(link);
		await user.click(link);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("triggers a single fetch for a burst of clicks fired before the re-render", async () => {
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		render(
			<FileDownloadLink href="/api/declaration-pdf">
				Télécharger le récapitulatif
			</FileDownloadLink>,
		);

		const link = screen.getByRole("link");
		await act(async () => {
			link.dispatchEvent(
				new MouseEvent("click", { bubbles: true, cancelable: true }),
			);
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
		const onBeforeDownload = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		render(
			<FileDownloadLink
				href="/api/declaration-pdf"
				onBeforeDownload={onBeforeDownload}
			>
				Télécharger le récapitulatif
			</FileDownloadLink>,
		);

		const notPrevented = fireEvent.click(screen.getByRole("link"), {
			metaKey: true,
		});

		expect(notPrevented).toBe(true);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(onBeforeDownload).not.toHaveBeenCalled();
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
			<FileDownloadLink
				href="/api/declaration-pdf"
				onBeforeDownload={onBeforeDownload}
			>
				Télécharger le récapitulatif
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
		render(
			<FileDownloadLink href="/api/declaration-pdf">
				Télécharger le récapitulatif
			</FileDownloadLink>,
		);

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
		render(
			<FileDownloadLink href="/api/declaration-pdf">
				Télécharger le récapitulatif
			</FileDownloadLink>,
		);

		await user.click(screen.getByRole("link"));
		expect(await screen.findByRole("alert")).toBeInTheDocument();

		await user.click(screen.getByRole("link"));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
		expect(clickSpy).toHaveBeenCalledTimes(1);
	});

	it("uses the default pending label when none is provided", async () => {
		const user = userEvent.setup();
		vi.stubGlobal("fetch", pendingFetch());
		render(
			<FileDownloadLink href="/api/no-sanction-pdf">
				Télécharger l&apos;attestation
			</FileDownloadLink>,
		);

		await user.click(screen.getByRole("link"));

		expect(screen.getByRole("link")).toHaveTextContent(
			"Téléchargement en cours…",
		);
	});
});
