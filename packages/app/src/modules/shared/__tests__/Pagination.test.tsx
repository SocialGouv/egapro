import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { buildPageNumbers, Pagination } from "../Pagination";

describe("Pagination", () => {
	it("renders navigation with correct aria-label", () => {
		render(
			<Pagination currentPage={1} onPageChange={vi.fn()} totalPages={3} />,
		);
		expect(
			screen.getByRole("navigation", { name: "Pagination" }),
		).toBeInTheDocument();
	});

	it("disables first/prev buttons on first page", () => {
		render(
			<Pagination currentPage={1} onPageChange={vi.fn()} totalPages={3} />,
		);
		expect(
			screen.getByRole("button", { name: "Première page" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Page précédente" }),
		).toBeDisabled();
	});

	it("disables next/last buttons on last page", () => {
		render(
			<Pagination currentPage={3} onPageChange={vi.fn()} totalPages={3} />,
		);
		expect(
			screen.getByRole("button", { name: "Page suivante" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Dernière page" }),
		).toBeDisabled();
	});

	it("calls onPageChange when a page button is clicked", async () => {
		const onPageChange = vi.fn();
		const user = userEvent.setup();
		render(
			<Pagination currentPage={1} onPageChange={onPageChange} totalPages={3} />,
		);

		await user.click(screen.getByTitle("Page 2"));
		expect(onPageChange).toHaveBeenCalledWith(2);
	});

	it("marks current page with aria-current", () => {
		render(
			<Pagination currentPage={2} onPageChange={vi.fn()} totalPages={3} />,
		);
		expect(screen.getByTitle("Page 2")).toHaveAttribute("aria-current", "page");
	});
});

describe("buildPageNumbers", () => {
	it("returns all pages when totalPages <= 7", () => {
		expect(buildPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
	});

	it("returns ellipsis for many pages", () => {
		const pages = buildPageNumbers(5, 10);
		expect(pages).toContain("ellipsis-start");
		expect(pages).toContain("ellipsis-end");
		expect(pages).toContain(1);
		expect(pages).toContain(10);
		expect(pages).toContain(5);
	});

	it("omits start ellipsis near beginning", () => {
		const pages = buildPageNumbers(2, 10);
		expect(pages).not.toContain("ellipsis-start");
		expect(pages).toContain("ellipsis-end");
	});

	it("omits end ellipsis near end", () => {
		const pages = buildPageNumbers(9, 10);
		expect(pages).toContain("ellipsis-start");
		expect(pages).not.toContain("ellipsis-end");
	});
});
