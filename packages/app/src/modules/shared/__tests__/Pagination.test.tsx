import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
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

	it("marks first/prev buttons inactive on first page and ignores their activation", async () => {
		const onPageChange = vi.fn();
		const user = userEvent.setup();
		render(
			<Pagination currentPage={1} onPageChange={onPageChange} totalPages={3} />,
		);
		const first = screen.getByRole("button", { name: "Première page" });
		const previous = screen.getByRole("button", { name: "Page précédente" });

		for (const button of [first, previous]) {
			expect(button).toHaveAttribute("aria-disabled", "true");
			// Never natively disabled: that would drop a focused button's focus.
			expect(button).toBeEnabled();
			await user.click(button);
			button.focus();
			await user.keyboard("{Enter}");
			await user.keyboard(" ");
		}
		expect(onPageChange).not.toHaveBeenCalled();
	});

	it("marks next/last buttons inactive on last page and ignores their activation", async () => {
		const onPageChange = vi.fn();
		const user = userEvent.setup();
		render(
			<Pagination currentPage={3} onPageChange={onPageChange} totalPages={3} />,
		);
		const next = screen.getByRole("button", { name: "Page suivante" });
		const last = screen.getByRole("button", { name: "Dernière page" });

		for (const button of [next, last]) {
			expect(button).toHaveAttribute("aria-disabled", "true");
			expect(button).toBeEnabled();
			await user.click(button);
			button.focus();
			await user.keyboard("{Enter}");
		}
		expect(onPageChange).not.toHaveBeenCalled();
	});

	it("leaves the step buttons that can act without aria-disabled", () => {
		render(
			<Pagination currentPage={2} onPageChange={vi.fn()} totalPages={3} />,
		);
		for (const name of [
			"Première page",
			"Page précédente",
			"Page suivante",
			"Dernière page",
		]) {
			expect(screen.getByRole("button", { name })).not.toHaveAttribute(
				"aria-disabled",
			);
		}
	});

	it.each([
		{ name: "Première page", from: 2, to: 1 },
		{ name: "Page précédente", from: 2, to: 1 },
		{ name: "Page suivante", from: 2, to: 3 },
		{ name: "Dernière page", from: 2, to: 3 },
	])("keeps keyboard focus on « $name » when it becomes inactive", async ({
		name,
		from,
		to,
	}) => {
		const user = userEvent.setup();
		function Paged() {
			const [page, setPage] = useState(from);
			return (
				<Pagination currentPage={page} onPageChange={setPage} totalPages={3} />
			);
		}
		render(<Paged />);
		const button = screen.getByRole("button", { name });
		button.focus();

		await user.keyboard("{Enter}");

		expect(screen.getByTitle(`Page ${to}`)).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(button).toHaveAttribute("aria-disabled", "true");
		// jsdom has no focus fixup, so a newly `disabled` button would still
		// report focus here; browsers move it to <body>. Staying enabled is what
		// keeps the focus in place.
		expect(button).toBeEnabled();
		expect(button).toHaveFocus();
	});

	it("moves to the targeted page from each step button that can act", async () => {
		const onPageChange = vi.fn();
		const user = userEvent.setup();
		render(
			<Pagination currentPage={3} onPageChange={onPageChange} totalPages={5} />,
		);

		await user.click(screen.getByRole("button", { name: "Première page" }));
		await user.click(screen.getByRole("button", { name: "Page précédente" }));
		await user.click(screen.getByRole("button", { name: "Page suivante" }));
		await user.click(screen.getByRole("button", { name: "Dernière page" }));
		expect(onPageChange.mock.calls).toEqual([[1], [2], [4], [5]]);
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
