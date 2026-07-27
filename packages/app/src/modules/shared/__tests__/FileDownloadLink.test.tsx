import {
	act,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";

import { FileDownloadLink, useFileDownload } from "../FileDownloadLink";

const createObjectURLMock = URL.createObjectURL as unknown as Mock;
const revokeObjectURLMock = URL.revokeObjectURL as unknown as Mock;

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
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
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
		expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
		expect(result.current.state).toBe("idle");
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
		render(
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
		expect(screen.getByRole("status")).toHaveTextContent(
			"Génération du récapitulatif en cours…",
		);

		await act(async () => {
			releaseFetch(pdfResponse());
		});
		await waitFor(() =>
			expect(screen.getByRole("link")).not.toHaveAttribute("aria-busy"),
		);
	});

	it("does not trigger a second fetch when clicked again while pending", async () => {
		const user = userEvent.setup();
		const fetchMock = vi.fn(() => new Promise<Response>(() => undefined));
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

	it("uses the default pending label when none is provided", async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => new Promise<Response>(() => undefined)),
		);
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
