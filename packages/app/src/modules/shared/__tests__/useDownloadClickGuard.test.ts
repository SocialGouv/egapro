import { act, renderHook, waitFor } from "@testing-library/react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";

import { pdfResponse, pendingFetch } from "~/test/downloadHelpers";
import { isNativeClick, useDownloadClickGuard } from "../useDownloadClickGuard";

const HREF = "/api/declaration-pdf";
const createObjectURLMock = URL.createObjectURL as unknown as Mock;
const revokeObjectURLMock = URL.revokeObjectURL as unknown as Mock;

const NATIVE_CLICK_MODIFIERS = [
	"altKey",
	"ctrlKey",
	"metaKey",
	"shiftKey",
] as const;

type Modifier = (typeof NATIVE_CLICK_MODIFIERS)[number];
type ClickEvent = ReactMouseEvent<HTMLAnchorElement> & {
	preventDefault: Mock;
};

function clickEvent(modifier?: Modifier): ClickEvent {
	return {
		altKey: false,
		ctrlKey: false,
		metaKey: false,
		shiftKey: false,
		...(modifier ? { [modifier]: true } : {}),
		preventDefault: vi.fn(),
	} as unknown as ClickEvent;
}

function renderGuard(onBeforeDownload?: () => void) {
	const { result } = renderHook(() =>
		useDownloadClickGuard(HREF, onBeforeDownload),
	);
	return {
		result,
		click: async (event: ClickEvent = clickEvent()) => {
			await act(async () => {
				result.current.anchorProps.onClick(event);
			});
			return event;
		},
		// Captures the handler once, so the whole burst runs against the render
		// that still believes the link is idle.
		burst: async (times: number) => {
			const { onClick } = result.current.anchorProps;
			await act(async () => {
				for (let i = 0; i < times; i++) onClick(clickEvent());
			});
		},
	};
}

function stubAnchor(): HTMLAnchorElement {
	const anchor = document.createElement("a");
	vi.spyOn(document, "createElement").mockReturnValue(anchor);
	return anchor;
}

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
		expect(isNativeClick(clickEvent(modifier))).toBe(true);
	});

	it("does not detect a plain click", () => {
		expect(isNativeClick(clickEvent())).toBe(false);
	});
});

describe("useDownloadClickGuard", () => {
	it("exposes an untouched link while idle", () => {
		const { result } = renderGuard();

		expect(result.current.state).toBe("idle");
		expect(result.current.anchorProps.href).toBe(HREF);
		expect(result.current.anchorProps["aria-busy"]).toBeUndefined();
		expect(result.current.anchorProps["aria-disabled"]).toBeUndefined();
	});

	it("fetches the blob, triggers a programmatic download and returns to idle", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve(pdfResponse('attachment; filename="recap.pdf"')),
			),
		);
		const { result, click } = renderGuard();

		const event = await click();

		expect(event.preventDefault).toHaveBeenCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(HREF);
		expect(createObjectURLMock).toHaveBeenCalledTimes(1);
		expect(clickSpy).toHaveBeenCalledTimes(1);
		expect(result.current.state).toBe("idle");
	});

	it("marks the link busy and disabled while the file is being generated", async () => {
		vi.stubGlobal("fetch", pendingFetch());
		const { result, click } = renderGuard();

		await click();

		expect(result.current.state).toBe("pending");
		expect(result.current.anchorProps["aria-busy"]).toBe("true");
		expect(result.current.anchorProps["aria-disabled"]).toBe("true");
	});

	it("keeps the object URL alive once the click is handed over to the browser", async () => {
		vi.useFakeTimers();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse())),
		);
		const { click } = renderGuard();

		await click();

		expect(clickSpy).toHaveBeenCalledTimes(1);
		expect(revokeObjectURLMock).not.toHaveBeenCalled();
	});

	it("revokes the object URL once the retention delay has elapsed", async () => {
		vi.useFakeTimers();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse())),
		);
		const { click } = renderGuard();

		await click();
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
		const { click } = renderGuard();
		const anchor = stubAnchor();
		let connectedDuringClick: boolean | undefined;
		clickSpy.mockImplementation(() => {
			connectedDuringClick = anchor.isConnected;
		});

		await click();

		expect(connectedDuringClick).toBe(true);
		expect(anchor.isConnected).toBe(false);
	});

	it("ignores a burst of clicks fired before the pending state is committed", async () => {
		const fetchMock = pendingFetch();
		vi.stubGlobal("fetch", fetchMock);
		const { burst } = renderGuard();

		await burst(3);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("ignores a further click once the pending state is visible", async () => {
		let releaseFetch: (response: Response) => void = () => undefined;
		const fetchMock = vi.fn(
			() =>
				new Promise<Response>((resolve) => {
					releaseFetch = resolve;
				}),
		);
		vi.stubGlobal("fetch", fetchMock);
		const { result, click } = renderGuard();

		await click();
		expect(result.current.state).toBe("pending");

		await click();
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await act(async () => {
			releaseFetch(pdfResponse());
		});
		await waitFor(() => expect(result.current.state).toBe("idle"));
	});

	it("leaves a modifier click to the browser's native behaviour", async () => {
		const fetchMock = pendingFetch();
		const onBeforeDownload = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const { result, click } = renderGuard(onBeforeDownload);

		const event = await click(clickEvent("metaKey"));

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(fetchMock).not.toHaveBeenCalled();
		expect(onBeforeDownload).not.toHaveBeenCalled();
		expect(result.current.state).toBe("idle");
	});

	it("invokes onBeforeDownload before firing the request", async () => {
		const calls: string[] = [];
		const onBeforeDownload = vi.fn(() => {
			calls.push("onBeforeDownload");
		});
		vi.stubGlobal(
			"fetch",
			vi.fn(() => {
				calls.push("fetch");
				return Promise.resolve(pdfResponse());
			}),
		);
		const { click } = renderGuard(onBeforeDownload);

		await click();

		expect(calls).toEqual(["onBeforeDownload", "fetch"]);
	});

	it("sets error state when the response is not ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse(undefined, { ok: false }))),
		);
		const { result, click } = renderGuard();

		await click();

		expect(result.current.state).toBe("error");
		expect(clickSpy).not.toHaveBeenCalled();
		expect(createObjectURLMock).not.toHaveBeenCalled();
	});

	it("sets error state when fetch rejects", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.reject(new Error("network down"))),
		);
		const { result, click } = renderGuard();

		await click();

		expect(result.current.state).toBe("error");
	});

	it("accepts a new download after a failed response", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(pdfResponse(undefined, { ok: false }))
			.mockResolvedValueOnce(pdfResponse());
		vi.stubGlobal("fetch", fetchMock);
		const { result, click } = renderGuard();

		await click();
		expect(result.current.state).toBe("error");

		await click();

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(result.current.state).toBe("idle");
	});

	it("accepts a new download after fetch rejected", async () => {
		const fetchMock = vi
			.fn()
			.mockRejectedValueOnce(new Error("network down"))
			.mockResolvedValueOnce(pdfResponse());
		vi.stubGlobal("fetch", fetchMock);
		const { result, click } = renderGuard();

		await click();
		expect(result.current.state).toBe("error");

		await click();

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(result.current.state).toBe("idle");
	});

	it("names the file from an ASCII Content-Disposition header", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve(pdfResponse('attachment; filename="recap-2026.pdf"')),
			),
		);
		const { click } = renderGuard();
		const anchor = stubAnchor();

		await click();

		expect(anchor.download).toBe("recap-2026.pdf");
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
		const { click } = renderGuard();
		const anchor = stubAnchor();

		await click();

		expect(anchor.download).toBe("récapitulatif.pdf");
	});

	it("leaves the download attribute unset when no filename can be parsed", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse("attachment"))),
		);
		const { click } = renderGuard();
		const anchor = stubAnchor();

		await click();

		expect(anchor.download).toBe("");
	});

	it("leaves the download attribute unset when the header is absent", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(pdfResponse())),
		);
		const { click } = renderGuard();
		const anchor = stubAnchor();

		await click();

		expect(anchor.download).toBe("");
	});
});
