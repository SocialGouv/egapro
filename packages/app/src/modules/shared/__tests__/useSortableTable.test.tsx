import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSortableTable } from "../useSortableTable";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock }),
	useSearchParams: () =>
		new URLSearchParams({ sortBy: "name", sortOrder: "asc", page: "1" }),
}));

describe("useSortableTable", () => {
	beforeEach(() => {
		pushMock.mockClear();
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
});
