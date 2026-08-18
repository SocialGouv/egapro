import { renderHook } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useSortableTable } from "../useSortableTable";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock }),
	useSearchParams: () =>
		new URLSearchParams({ sortBy: "name", sortOrder: "asc", page: "1" }),
}));

const scrollToSpy = vi
	.spyOn(window, "scrollTo")
	.mockImplementation(() => undefined);

describe("useSortableTable", () => {
	beforeEach(() => {
		pushMock.mockClear();
		scrollToSpy.mockClear();
	});

	afterAll(() => {
		scrollToSpy.mockRestore();
	});

	it("toggles the sort order when clicking the current column", () => {
		const { result } = renderHook(() =>
			useSortableTable({
				basePath: "/admin/x",
				sortBy: "name",
				sortOrder: "asc",
			}),
		);
		result.current.handleSort("name");
		const url = pushMock.mock.calls[0]?.[0] as string;
		expect(url).toContain("sortOrder=desc");
		expect(url).toContain("page=1");
	});

	it("switches the column and resets to ascending on a new column click", () => {
		const { result } = renderHook(() =>
			useSortableTable({
				basePath: "/admin/x",
				sortBy: "name",
				sortOrder: "desc",
			}),
		);
		result.current.handleSort("email");
		const url = pushMock.mock.calls[0]?.[0] as string;
		expect(url).toContain("sortBy=email");
		expect(url).toContain("sortOrder=asc");
	});

	it("pushes the new page number", () => {
		const { result } = renderHook(() =>
			useSortableTable({
				basePath: "/admin/x",
				sortBy: "name",
				sortOrder: "asc",
			}),
		);
		result.current.handlePageChange(3);
		expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("page=3"));
	});

	it("scrolls back to the top after changing the page", () => {
		const { result } = renderHook(() =>
			useSortableTable({
				basePath: "/admin/x",
				sortBy: "name",
				sortOrder: "asc",
			}),
		);
		result.current.handlePageChange(3);
		expect(scrollToSpy).toHaveBeenCalledWith({
			top: 0,
			left: 0,
			behavior: "instant",
		});
	});

	it("scrolls back to the top after sorting a column", () => {
		const { result } = renderHook(() =>
			useSortableTable({
				basePath: "/admin/x",
				sortBy: "name",
				sortOrder: "asc",
			}),
		);
		result.current.handleSort("name");
		expect(scrollToSpy).toHaveBeenCalledWith({
			top: 0,
			left: 0,
			behavior: "instant",
		});
	});

	it("returns ariaSort and sortIcon for the active column only", () => {
		const { result } = renderHook(() =>
			useSortableTable({
				basePath: "/admin/x",
				sortBy: "name",
				sortOrder: "desc",
			}),
		);
		expect(result.current.ariaSort("name")).toBe("descending");
		expect(result.current.ariaSort("other")).toBeUndefined();
		expect(result.current.sortIcon("name")).toBe(" ▼");
		expect(result.current.sortIcon("other")).toBeNull();
	});

	it("reflects the ascending order in ariaSort, sortIcon and the toggle", () => {
		const { result } = renderHook(() =>
			useSortableTable({
				basePath: "/admin/x",
				sortBy: "name",
				sortOrder: "asc",
			}),
		);
		expect(result.current.ariaSort("name")).toBe("ascending");
		expect(result.current.sortIcon("name")).toBe(" ▲");
	});

	it("toggles from descending back to ascending on the current column", () => {
		const { result } = renderHook(() =>
			useSortableTable({
				basePath: "/admin/x",
				sortBy: "name",
				sortOrder: "desc",
			}),
		);
		result.current.handleSort("name");
		expect(pushMock.mock.calls[0]?.[0] as string).toContain("sortOrder=asc");
	});
});
