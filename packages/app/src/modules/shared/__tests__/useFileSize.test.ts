import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFileSize } from "../useFileSize";

function headResponse(contentLength: string | null, ok = true): Response {
	return {
		ok,
		headers: {
			get: (name: string) =>
				name.toLowerCase() === "content-length" ? contentLength : null,
		},
	} as unknown as Response;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useFileSize", () => {
	it("probes the href with HEAD and returns the advertised length", async () => {
		const fetchMock = vi.fn(() => Promise.resolve(headResponse("63365")));
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() => useFileSize("/api/declaration-pdf"));

		await waitFor(() => expect(result.current).toBe(63365));
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/declaration-pdf",
			expect.objectContaining({ method: "HEAD" }),
		);
	});

	it("stays null when the response carries no Content-Length", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(headResponse(null))),
		);

		const { result } = renderHook(() => useFileSize("/api/declaration-pdf"));

		await act(async () => undefined);
		expect(result.current).toBeNull();
	});

	it("stays null when the header is not a number", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(headResponse("unknown"))),
		);

		const { result } = renderHook(() => useFileSize("/api/declaration-pdf"));

		await act(async () => undefined);
		expect(result.current).toBeNull();
	});

	it("stays null when the response is not ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(headResponse("63365", false))),
		);

		const { result } = renderHook(() => useFileSize("/api/declaration-pdf"));

		await act(async () => undefined);
		expect(result.current).toBeNull();
	});

	it("swallows a failing probe rather than throwing", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.reject(new Error("network down"))),
		);

		const { result } = renderHook(() => useFileSize("/api/declaration-pdf"));

		await act(async () => undefined);
		expect(result.current).toBeNull();
	});

	it("aborts the probe when the component unmounts before the answer", async () => {
		const abortSpy = vi.fn();
		const fetchMock = vi.fn(
			(_href: string, init: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init.signal?.addEventListener("abort", () => {
						abortSpy();
						reject(new Error("aborted"));
					});
				}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const { unmount } = renderHook(() => useFileSize("/api/declaration-pdf"));
		unmount();

		await waitFor(() => expect(abortSpy).toHaveBeenCalledTimes(1));
	});

	it("re-probes when the href changes", async () => {
		const fetchMock = vi.fn((href: string) =>
			Promise.resolve(headResponse(href.includes("2027") ? "70000" : "63365")),
		);
		vi.stubGlobal("fetch", fetchMock);

		const { result, rerender } = renderHook(
			({ href }: { href: string }) => useFileSize(href),
			{ initialProps: { href: "/api/declaration-pdf?year=2026" } },
		);

		await waitFor(() => expect(result.current).toBe(63365));

		rerender({ href: "/api/declaration-pdf?year=2027" });

		await waitFor(() => expect(result.current).toBe(70000));
	});
});
